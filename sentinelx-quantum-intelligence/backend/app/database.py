from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
from .config import settings

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBTransaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    tx_id = Column(String(50), unique=True, index=True)
    source_acc = Column(String(50), index=True)
    dest_acc = Column(String(50), index=True)
    amount = Column(Float)
    channel = Column(String(50))
    location = Column(String(100))
    device_id = Column(String(100))
    is_fraud = Column(Boolean, default=False)
    risk_score = Column(Float)

class DBIncident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    severity = Column(String(50))  # Critical, High, Medium, Low
    status = Column(String(50))    # Active, Investigating, Resolved, Mitigated
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    root_cause = Column(Text)
    evidence_chain = Column(Text)  # JSON-encoded array
    mitre_techniques = Column(String(200))
    confidence_score = Column(Float)
    quantum_risk_factor = Column(Boolean, default=False)
    business_impact = Column(Text)
    suggested_remediation = Column(Text)
    analyst_notes = Column(Text, nullable=True)

class DBRiskProfile(Base):
    __tablename__ = "risk_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(100), unique=True, index=True) # User/Employee ID, Device ID, Server IP, Account No
    entity_type = Column(String(50)) # Customer, Employee, Device, Server, Account
    trust_score = Column(Float, default=100.0)
    threat_score = Column(Float, default=0.0)
    fraud_score = Column(Float, default=0.0)
    quantum_risk_score = Column(Float, default=0.0)
    identity_confidence = Column(Float, default=100.0)
    business_risk = Column(Float, default=0.0)
    operational_risk = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class DBAuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String(100))
    action = Column(String(200))
    details = Column(Text)
    status = Column(String(50)) # Success, Failed

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
