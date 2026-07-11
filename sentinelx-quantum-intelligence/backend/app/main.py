from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import asyncio

from .config import settings
from .database import get_db, init_db, DBRiskProfile, DBTransaction, DBIncident, DBAuditLog
from .graph_engine import graph_instance
from .services.simulator import AttackScenarioSimulator
from .services.response_engine import ResponseEngine

app = FastAPI(title=settings.PROJECT_NAME)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Initialize DB on Startup
@app.on_event("startup")
def on_startup():
    init_db()
    # Initialize the simulator session
    db = next(get_db())
    simulator = AttackScenarioSimulator(db)
    simulator.reset()

@app.get("/")
def read_root():
    return {"message": "Welcome to SentinelX Quantum Intelligence API Engine."}

@app.get("/api/simulator/status")
def get_sim_status(db: Session = Depends(get_db)):
    sim = AttackScenarioSimulator(db)
    # Check if there are active entries in DB
    cnt = db.query(DBRiskProfile).count()
    if cnt == 0:
        sim.reset()
    
    # We want to persist the current step of simulation. We'll derive it from DB incident counts
    inc_count = db.query(DBIncident).count()
    # If there is an incident, step is 6. Otherwise we can fetch mock session steps
    step = 6 if inc_count > 0 else 0
    
    # Let's read step from a local text variable or file. For ease, we'll store a global state
    return {"step": step, "max_steps": 6, "description": sim._get_step_description(step)}

# Global step holder
SIM_STEP = 0

@app.post("/api/simulator/advance")
async def advance_sim(db: Session = Depends(get_db)):
    global SIM_STEP
    sim = AttackScenarioSimulator(db)
    sim.step = SIM_STEP
    status = sim.advance_step()
    SIM_STEP = sim.step
    
    # Broadcast update to websocket clients
    data_update = {
        "event": "SIMULATION_UPDATE",
        "step": SIM_STEP,
        "description": status["description"],
        "scores": [
            {
                "entity_id": p.entity_id,
                "entity_type": p.entity_type,
                "trust_score": p.trust_score,
                "threat_score": p.threat_score,
                "fraud_score": p.fraud_score,
                "quantum_risk_score": p.quantum_risk_score,
                "identity_confidence": p.identity_confidence,
                "business_risk": p.business_risk,
                "operational_risk": p.operational_risk
            } for p in db.query(DBRiskProfile).all()
        ]
    }
    await manager.broadcast(json.dumps(data_update))
    return status

@app.post("/api/simulator/reset")
async def reset_sim(db: Session = Depends(get_db)):
    global SIM_STEP
    sim = AttackScenarioSimulator(db)
    status = sim.reset()
    SIM_STEP = 0
    
    data_update = {
        "event": "SIMULATION_RESET",
        "step": 0,
        "description": status["description"]
    }
    await manager.broadcast(json.dumps(data_update))
    return status

@app.get("/api/risk-scores")
def get_risk_scores(db: Session = Depends(get_db)):
    return db.query(DBRiskProfile).all()

@app.get("/api/transactions")
def get_transactions(db: Session = Depends(get_db)):
    return db.query(DBTransaction).all()

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    return db.query(DBIncident).all()

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(DBAuditLog).order_by(DBAuditLog.timestamp.desc()).all()

@app.get("/api/graph")
def get_graph():
    return graph_instance.get_graph()

@app.post("/api/respond")
def trigger_response(payload: dict, db: Session = Depends(get_db)):
    action = payload.get("action")
    target = payload.get("target")
    if not action or not target:
        raise HTTPException(status_code=400, detail="Action and target are required.")
    
    result = ResponseEngine.execute_action(action, target, db)
    return result

@app.post("/api/copilot")
def query_copilot(payload: dict, db: Session = Depends(get_db)):
    query = payload.get("query", "").lower()
    
    # AI Investigation Copilot matching
    if "compromised devices" in query or "transactions" in query:
        response = {
            "answer": "Scanning graph relationships... I identified 1 compromised account (ACC-581920) linked directly to the compromised administration console (DEV-SWIFT-SRV) and employee endpoint (DEV-SECOPS-01). The transaction TX-SWIFT9901 ($950,000) was routed through these nodes.",
            "evidence": [
                {"source": "DEV-SECOPS-01", "relation": "RDP_ACCESS ->", "target": "DEV-SWIFT-SRV"},
                {"source": "DEV-SWIFT-SRV", "relation": "ACCESSES ->", "target": "ACC-581920"},
                {"source": "ACC-581920", "relation": "ANOMALOUS_TRANSFER ->", "target": "ACC-992019"}
            ],
            "recommendation": "Execute standard mitigation protocol: Freeze Account ACC-581920 immediately, invalidate DEV-SECOPS-01 session, and terminate active VPN flows."
        }
    elif "quantum" in query or "rsa" in query or "decrypt" in query:
        response = {
            "answer": "Identified 1 active cryptographic node (KEY-RSA-01) running RSA-2048 and TLSv1.1, making it highly susceptible to Harvest Now Decrypt Later (HNDL) attacks.",
            "evidence": [
                {"source": "DEV-SWIFT-SRV", "relation": "ENCRYPTED_WITH ->", "target": "KEY-RSA-01 (RSA-2048)"}
            ],
            "recommendation": "Rotate certificate and upgrade cryptographic key to Kyber768 Post-Quantum algorithm."
        }
    else:
        response = {
            "answer": "System normal. Ready to inspect threat graphs, cryptographic inventories, and user behavior drift metrics. Try querying: 'Show all transactions influenced by compromised devices.'",
            "evidence": [],
            "recommendation": "Monitor live telemetry streams."
        }
        
    return response

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive channel
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"status": "healthy"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
