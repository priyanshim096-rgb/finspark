from .base_agent import BaseAgent
from ..risk_engine import calculate_scores
import datetime

class CyberCorrelationAgent(BaseAgent):
    def __init__(self):
        super().__init__("CyberCorrelationAgent", "Cyber Threat Correlation Specialist")
        # Keep track of active cyber event sequence per device/user
        self.attack_chains = {}

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        event_type = event_data.get("event_type")
        username = event_data.get("username", "Unknown")
        device_id = event_data.get("device_id", "Unknown")
        proc = event_data.get("process_name", "")
        mitre = event_data.get("mitre_technique", "None")
        
        chain_key = device_id or username
        if chain_key not in self.attack_chains:
            self.attack_chains[chain_key] = []
            
        alert = None
        if mitre != "None" or proc in ["powershell.exe", "cmd.exe", "lsass.exe"]:
            self.attack_chains[chain_key].append(event_data)
            
            # Learn Attack Chain progression
            chain_len = len(self.attack_chains[chain_key])
            if chain_len >= 2:
                alert = {
                    "agent": self.name,
                    "severity": "High" if chain_len < 4 else "Critical",
                    "title": f"Correlated Attack Chain Progression on {device_id}",
                    "details": f"Detected progression of {chain_len} anomalous events. Latest: {proc} triggering MITRE mapping {mitre}.",
                    "mitre": mitre,
                    "chain": [e.get("process_name") for e in self.attack_chains[chain_key]]
                }
        return {"alert": alert, "chains": self.attack_chains[chain_key]}


class BehaviorIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__("BehaviorIntelligenceAgent", "User & Entity Behavior Profiler (UEBA)")
        # Normal profile registry (Digital Twin data)
        self.profiles = {
            "EMP-9402": {
                "normal_login_hours": [8, 18],
                "normal_locations": ["Mumbai, IN"],
                "normal_device": "DEV-SECOPS-01",
                "normal_typing_rhythm": 0.95
            }
        }

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        user = event_data.get("username")
        geo = event_data.get("geolocation", "Mumbai, IN")
        success = event_data.get("success", 1)
        
        profile = self.profiles.get(user)
        drift = {}
        alert = None
        
        if profile:
            # Check geographical drift
            if geo not in profile["normal_locations"]:
                drift["geo_drift"] = True
                alert = {
                    "agent": self.name,
                    "severity": "Medium",
                    "title": f"Anomalous Location Access for {user}",
                    "details": f"Access initiated from {geo}, which is outside user's baseline location profile: {profile['normal_locations']}.",
                    "confidence": 0.88
                }
        else:
            # Seed profile dynamically
            self.profiles[user] = {
                "normal_login_hours": [9, 17],
                "normal_locations": [geo],
                "normal_device": event_data.get("device_id", "Unknown"),
                "normal_typing_rhythm": 0.90
            }
            
        return {"profile": self.profiles.get(user), "drift": drift, "alert": alert}


class TransactionIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__("TransactionIntelligenceAgent", "Financial Transaction Integrity Inspector")

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        amount = event_data.get("amount", 0.0)
        channel = event_data.get("channel", "")
        dest = event_data.get("dest_acc", "")
        
        alert = None
        # Sigmoid trigger on transactions > $800k or high risk score
        if amount > 800000.0 or event_data.get("risk_score", 0.0) > 75.0:
            alert = {
                "agent": self.name,
                "severity": "High",
                "title": "High-Value Transaction Anomaly",
                "details": f"Outbound {channel} transaction to account {dest} for ${amount:,.2f} exceeds dynamic variance bounds.",
                "confidence": 0.92,
                "impact": f"Potential capital loss of ${amount:,.2f}"
            }
        return {"alert": alert}


class InsiderThreatAgent(BaseAgent):
    def __init__(self):
        super().__init__("InsiderThreatAgent", "Insider Risk & Behavior Drift Tracker")

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        wh_drift = event_data.get("working_hours_drift", 0.0)
        ev_drift = event_data.get("email_volume_drift", 0.0)
        cmd_drift = event_data.get("cmd_anomaly_drift", 0.0)
        
        alert = None
        total_drift = wh_drift + ev_drift + cmd_drift
        if total_drift > 180.0 or cmd_drift > 80.0:
            alert = {
                "agent": self.name,
                "severity": "Medium" if total_drift < 250.0 else "High",
                "title": f"Significant Employee Behavioral Drift Detected",
                "details": f"Employee exhibiting critical activity pattern drift: Command anomaly {cmd_drift}%, Email Volume {ev_drift}%.",
                "confidence": 0.85
            }
        return {"alert": alert, "drift_sum": total_drift}


class FraudEvolutionAgent(BaseAgent):
    def __init__(self):
        super().__init__("FraudEvolutionAgent", "Evolving Fraud Pattern Discovery Engine")
        # Store historical patterns to track mutation
        self.known_patterns = ["smurfing", "velocity_burst", "layering"]

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        # Looking for never-before-seen patterns using context embeddings / clustering mock
        amount = event_data.get("amount", 0)
        is_fraud = event_data.get("is_fraud", 0)
        
        alert = None
        if is_fraud and amount < 50.0:
            # A micro-transaction fraud pattern (smurfing/testing card credentials)
            alert = {
                "agent": self.name,
                "severity": "Medium",
                "title": "Novel Micro-Fraud Transaction Signature",
                "details": "Rapid micro-transfers detected from clean accounts. Bypasses classic high-value thresholds. Pattern represents automated credential validation.",
                "confidence": 0.78,
                "novelty": "High"
            }
        return {"alert": alert}


class QuantumRiskAgent(BaseAgent):
    def __init__(self):
        super().__init__("QuantumRiskAgent", "Quantum-Safe Cryptographic Risk Auditor")

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        algo = event_data.get("algorithm", "")
        key_size = event_data.get("key_size", 2048)
        tls_version = event_data.get("tls_version", "TLSv1.2")
        
        alert = None
        # Checks for legacy algorithms susceptible to Harvest Now Decrypt Later (HNDL)
        if algo in ["RSA", "ECC", "ECDSA"] and key_size <= 2048:
            alert = {
                "agent": self.name,
                "severity": "High",
                "title": "Harvest Now Decrypt Later (HNDL) Vulnerability",
                "details": f"Data transfer secured with legacy {algo}-{key_size} on {tls_version}. Vulnerable to quantum-assisted decryption by adversaries harvesting encrypted traffic today.",
                "remediation": "Transition key to Kyber768 or Dilithium3; Upgrade TLS to v1.3",
                "quantum_relevance": True
            }
        return {"alert": alert}


class ExecutiveDecisionAgent(BaseAgent):
    def __init__(self):
        super().__init__("ExecutiveDecisionAgent", "Executive Orchestrator & Explainable Incident Summarizer")

    def synthesize_incident(self, alerts: list, affected_entities: list) -> dict:
        """
        Produce a world-class Explainable Incident Report (Attack Story)
        correlating telemetry, root cause, evidence chain, MITRE tactics,
        and predictions.
        """
        now = datetime.datetime.utcnow().isoformat()
        
        # Determine severity based on constituents
        severities = [a.get("severity", "Low") for a in alerts]
        final_severity = "Medium"
        if "Critical" in severities:
            final_severity = "Critical"
        elif "High" in severities:
            final_severity = "High"
            
        mitre_list = [a.get("mitre") for a in alerts if a.get("mitre")]
        mitre_str = ", ".join(mitre_list) if mitre_list else "T1059 (Execution), T1048 (Exfiltration)"
        
        evidence_chain = []
        for i, a in enumerate(alerts):
            evidence_chain.append({
                "step": i + 1,
                "agent": a.get("agent"),
                "finding": a.get("title"),
                "details": a.get("details")
            })
            
        # Mock LLM generation for incident summarization (highly structured)
        root_cause = "Exfiltration of sensitive SWIFT transactional database via a compromised SecOps engineer credential (EMP-9402) using PowerShell execution over VPN."
        
        business_impact = (
            "Potential compromise of SWIFT Settlement System integrity. "
            "Regulatory non-compliance (RBI Guidelines, PCI-DSS) leading to statutory fines up to $5M. "
            "Severe reputational impact and loss of customer trust."
        )
        
        predicted_action = "Attempted exfiltration of encrypted backups via DNS tunneling or outbound TLS channels."
        
        counterfactual = (
            "If Multi-Factor Authentication had been enforced at the VPN endpoint for anomalies, "
            "the session would have been frozen automatically at Step 2, preventing database access."
        )
        
        remediation = (
            "1. Freeze Employee Account (EMP-9402) and invalidate active VPN sessions.\n"
            "2. Rotate TLS certificate CERT-SWIFT-TLS and migrate to Kyber768 quantum-safe cryptography.\n"
            "3. Block rogue destination IP address.\n"
            "4. Trigger Step-Up authentication for all transactions > $500k."
        )
        
        incident_report = {
            "title": "Quantum-Threatened SWIFT Database Exfiltration Attempt",
            "severity": final_severity,
            "status": "Active",
            "timestamp": now,
            "root_cause": root_cause,
            "evidence_chain": evidence_chain,
            "mitre_techniques": mitre_str,
            "confidence_score": 94.5,
            "quantum_risk_factor": any(a.get("quantum_relevance") for a in alerts),
            "business_impact": business_impact,
            "predicted_next_attacker_action": predicted_action,
            "counterfactual_explanation": counterfactual,
            "suggested_remediation": remediation,
            "affected_assets": ", ".join(affected_entities)
        }
        
        return incident_report
