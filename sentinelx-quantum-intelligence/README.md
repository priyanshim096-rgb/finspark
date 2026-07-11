# SentinelX Quantum Intelligence Platform

## Overview
**SentinelX** is a next-generation banking intelligence platform designed to secure digital trust across multi-channel financial systems. By correlating cybersecurity alerts, network flows, user/entity behavior (UEBA), and cryptographic keys into a single **Dynamic Knowledge Graph**, SentinelX identifies complex multi-stage attack scenarios that separate systems miss. 

It implements 7 domain-specific AI agents, a continuous Bayesian trust scoring engine, and an autonomous mitigation orchestrator styled after **Palantir Gotham** aesthetics.

---

## Architecture Diagram (Event Correlation & AI Pipelines)

```mermaid
graph TD
    A[Logs Ingest: Transactions, VPN, Endpoint, TLS] --> B[Apache Kafka Stream Buffer]
    B --> C[Apache Flink Real-time Event Processor]
    C --> D[Dynamic Knowledge Graph Engine (Neo4j)]
    D --> E[7 AI Agents Hub]
    E --> F[Continuous Bayesian Risk Engine]
    F --> G[Explainable Incident timeline (Attack Story)]
    F --> H[Entity Behavior Digital Twins]
    G --> I[Autonomous Response SOAR Engine]
    I --> J[Action Execution: Freeze, Cert Rotate, Block IP]
    F --> K[Websocket UI Broadcasting Service]
```

---

## 7 Core AI Agents
1. **Cyber Correlation Agent**: Identifies multi-stage attack patterns using MITRE ATT&CK mappings.
2. **Behavior Intelligence Agent**: Learns digital behavior profiles (typing cadence, login times, geo-deviation).
3. **Transaction Intelligence Agent**: Flags anomalous RTGS, NEFT, IMPS spikes using dynamic sigmoidal bounds.
4. **Insider Threat Agent**: Aggregates behavioral drifts (working hours offset, email bursts, shell executions).
5. **Fraud Evolution Agent**: Discovers mutating micro-transaction fraud signatures.
6. **Quantum Risk Agent**: Monitors cryptosystem vulnerability to "Harvest Now, Decrypt Later" (HNDL) attacks.
7. **Executive Decision Agent**: Generates explainable, evidence-backed Incident Reports (Attack Stories) containing root causes and counterfactuals.

---

## Risk Scoring Mathematical Formulas

### 1. Bayesian Update for Threat Probability
When anomalous event evidence $E$ is observed, the prior threat probability $P(T)$ is updated to posterior $P(T|E)$ using Bayes' rule:
$$P(T|E) = \frac{P(E|T) \cdot P(T)}{P(E|T) \cdot P(T) + P(E|\sim T) \cdot (1 - P(T))}$$
*Where:*
- $P(E|T)$ is the likelihood of seeing the anomaly given a compromised state (e.g. 0.85).
- $P(E|\sim T)$ is the likelihood of seeing the anomaly given a normal state (e.g. 0.05).

### 2. Trust Score Decay Formula
Trust scores are dynamically calculated within the range $[0, 100]$:
$$\text{Trust} = 100 - \left( 0.30 \cdot \text{Threat} + 0.25 \cdot \text{Fraud} + 0.15 \cdot \text{QuantumRisk} + 0.30 \cdot (100 - \text{IdentityConfidence}) \right)$$

---

## Database Schemas (PostgreSQL & SQLite equivalent)
```sql
-- Transactions table for financial tracking
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tx_id VARCHAR(50) UNIQUE NOT NULL,
    source_acc VARCHAR(50) INDEX,
    dest_acc VARCHAR(50) INDEX,
    amount DOUBLE PRECISION,
    channel VARCHAR(50),
    location VARCHAR(100),
    device_id VARCHAR(100),
    is_fraud BOOLEAN DEFAULT FALSE,
    risk_score DOUBLE PRECISION
);

-- Incidents table representing correlated Attack Stories
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(50),
    status VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    root_cause TEXT,
    evidence_chain TEXT, -- JSON structure
    mitre_techniques VARCHAR(200),
    confidence_score DOUBLE PRECISION,
    quantum_risk_factor BOOLEAN DEFAULT FALSE,
    business_impact TEXT,
    suggested_remediation TEXT
);
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Docker & Docker Compose (optional)

### 1. Run via Docker Compose (Recommended)
Launch the microservice infrastructure with one command:
```bash
docker-compose up --build
```
- Access **Frontend Dashboard**: `http://localhost`
- Access **FastAPI Backend Swagger**: `http://localhost:8000/docs`

### 2. Manual Local Installation (Windows/macOS/Linux)
1. **Start FastAPI Backend**:
   ```bash
   pip install fastapi uvicorn sqlalchemy pandas scikit-learn
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```
2. **Launch Frontend Dashboard**:
   Simply open `frontend/index.html` in any web browser.

3. **Verify Simulation**:
   Click **ADVANCE SIMULATION STEP** to propagate threats (Process injection $\rightarrow$ VPN session theft $\rightarrow$ Credential dumping $\rightarrow$ Legacy crypto exfiltration $\rightarrow$ High-value bank wire) and watch the Live Attack Graph updates in real-time.
