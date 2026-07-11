import datetime
from ..graph_engine import graph_instance
from ..risk_engine import calculate_scores
from ..database import DBRiskProfile, DBTransaction, DBIncident
from ..agents import (
    CyberCorrelationAgent,
    BehaviorIntelligenceAgent,
    TransactionIntelligenceAgent,
    InsiderThreatAgent,
    FraudEvolutionAgent,
    QuantumRiskAgent,
    ExecutiveDecisionAgent
)

class AttackScenarioSimulator:
    def __init__(self, db_session):
        self.db = db_session
        self.step = 0
        
        # Instantiate agents
        self.cyber_agent = CyberCorrelationAgent()
        self.behavior_agent = BehaviorIntelligenceAgent()
        self.tx_agent = TransactionIntelligenceAgent()
        self.insider_agent = InsiderThreatAgent()
        self.fraud_agent = FraudEvolutionAgent()
        self.quantum_agent = QuantumRiskAgent()
        self.exec_agent = ExecutiveDecisionAgent()
        
        self.active_alerts = []

    def get_status(self):
        return {
            "current_step": self.step,
            "max_steps": 6,
            "description": self._get_step_description(self.step),
            "alerts_count": len(self.active_alerts)
        }

    def reset(self):
        self.step = 0
        self.active_alerts = []
        graph_instance.clear_threats()
        
        # Reset DB risk profiles to baseline
        self.db.query(DBRiskProfile).delete()
        self.db.query(DBIncident).delete()
        self.db.query(DBTransaction).delete()
        
        baselines = [
            ("EMP-9402", "Customer", 95.0, 5.0, 2.0, 10.0, 98.0, 5.0, 5.0),
            ("DEV-SECOPS-01", "Device", 98.0, 2.0, 0.0, 5.0, 99.0, 2.0, 2.0),
            ("DEV-SWIFT-SRV", "Server", 94.0, 5.0, 0.0, 50.0, 95.0, 10.0, 15.0),
            ("ACC-581920", "Account", 96.0, 2.0, 1.0, 5.0, 99.0, 12.0, 5.0),
        ]
        for ent, typ, tr, th, fr, qr, idc, br, ork in baselines:
            prof = DBRiskProfile(
                entity_id=ent,
                entity_type=typ,
                trust_score=tr,
                threat_score=th,
                fraud_score=fr,
                quantum_risk_score=qr,
                identity_confidence=idc,
                business_risk=br,
                operational_risk=ork
            )
            self.db.add(prof)
        self.db.commit()
        return self.get_status()

    def advance_step(self):
        if self.step >= 6:
            return self.get_status()
            
        self.step += 1
        
        # Execute scenario steps
        if self.step == 1:
            # Step 1: Endpoint Alert - PowerShell execution on Devon's laptop
            evt = {
                "event_type": "Process Creation",
                "process_name": "powershell.exe",
                "mitre_technique": "T1059.001 (PowerShell Script Execution)",
                "device_id": "DEV-SECOPS-01",
                "username": "EMP-9402",
                "alert_level": "Medium"
            }
            # Update knowledge graph
            graph_instance.add_node("DEV-SECOPS-01", "DEV-SECOPS-01 (PowerShell Triggered)", "Device", health="Vulnerable")
            graph_instance.add_edge("DEV-SECOPS-01", "powershell.exe", "EXECUTED", 0.9)
            
            # Analyze
            res = self.cyber_agent.analyze(evt, {})
            if res.get("alert"): self.active_alerts.append(res["alert"])
            self._update_db_scores("DEV-SECOPS-01", "Device", "Process Creation", evt)
            self._update_db_scores("EMP-9402", "Customer", "Process Creation", evt)

        elif self.step == 2:
            # Step 2: VPN Anomaly - Login from foreign IP
            evt = {
                "event_type": "VPN",
                "username": "EMP-9402",
                "device_id": "DEV-SECOPS-01",
                "geolocation": "Beijing, CN",
                "ip_address": "185.220.101.5",
                "success": 1
            }
            graph_instance.add_node("IP-185.220.101.5", "IP-185.220.101.5 (Beijing)", "External IP", reputation="Suspicious")
            graph_instance.add_edge("IP-185.220.101.5", "DEV-SECOPS-01", "LOGGED_INTO", 1.0)
            
            res = self.behavior_agent.analyze(evt, {})
            if res.get("alert"): self.active_alerts.append(res["alert"])
            self._update_db_scores("EMP-9402", "Customer", "VPN", evt)
            self._update_db_scores("DEV-SECOPS-01", "Device", "VPN", evt)

        elif self.step == 3:
            # Step 3: Server Privilege Escalation & SQL Export
            evt = {
                "event_type": "Process Creation",
                "process_name": "lsass.exe",
                "mitre_technique": "T1003 (Credential Dumping)",
                "device_id": "DEV-SWIFT-SRV",
                "username": "EMP-9402",
                "alert_level": "Critical"
            }
            graph_instance.add_node("DEV-SWIFT-SRV", "SWIFT Gateway Server (Alert)", "Server", health="Critical")
            graph_instance.add_edge("DEV-SECOPS-01", "DEV-SWIFT-SRV", "RDP_ACCESS", 1.0)
            graph_instance.add_edge("DEV-SWIFT-SRV", "lsass.exe", "DUMPED", 1.0)
            
            res = self.cyber_agent.analyze(evt, {})
            if res.get("alert"): self.active_alerts.append(res["alert"])
            self._update_db_scores("DEV-SWIFT-SRV", "Server", "Process Creation", evt)

        elif self.step == 4:
            # Step 4: Quantum Vulnerability Check - Legacy Cryptography Used for Backups
            evt = {
                "event_type": "Quantum Cryptography",
                "algorithm": "RSA",
                "key_size": 2048,
                "tls_version": "TLSv1.1",
                "expiry_days": -3,
                "key_id": "KEY-RSA-01"
            }
            graph_instance.add_node("KEY-RSA-01", "RSA-2048 (Harvest Danger)", "Encryption Key", strength="Vulnerable")
            graph_instance.add_edge("DEV-SWIFT-SRV", "KEY-RSA-01", "EXPOSES_TRAFFIC", 0.9)
            
            res = self.quantum_agent.analyze(evt, {})
            if res.get("alert"): self.active_alerts.append(res["alert"])
            self._update_db_scores("DEV-SWIFT-SRV", "Server", "Quantum Cryptography", evt)

        elif self.step == 5:
            # Step 5: Insider Behavior Drift
            evt = {
                "event_type": "Insider Threat",
                "employee_id": "EMP-9402",
                "working_hours_drift": 110.0,
                "email_volume_drift": 250.0,
                "cmd_anomaly_drift": 90.0
            }
            graph_instance.add_node("EMP-9402", "Devon Miller (High Drift)", "Employee", status="Investigating")
            res = self.insider_agent.analyze(evt, {})
            if res.get("alert"): self.active_alerts.append(res["alert"])
            self._update_db_scores("EMP-9402", "Customer", "Insider Threat", evt)

        elif self.step == 6:
            # Step 6: Anomalous Swift Transfer & Creation of Attack Story
            evt = {
                "event_type": "Transaction",
                "amount": 950000.0,
                "channel": "RTGS",
                "source_acc": "ACC-581920",
                "dest_acc": "ACC-992019",
                "is_fraud": 1,
                "risk_score": 92.5
            }
            # Record in Transactions DB
            db_tx = DBTransaction(
                tx_id="TX-SWIFT9901",
                source_acc="ACC-581920",
                dest_acc="ACC-992019",
                amount=950000.0,
                channel="RTGS",
                location="Beijing, CN",
                device_id="DEV-SECOPS-01",
                is_fraud=True,
                risk_score=92.5
            )
            self.db.add(db_tx)
            
            graph_instance.add_edge("ACC-581920", "ACC-992019", "ANOMALOUS_TRANSFER", 0.95)
            
            res_tx = self.tx_agent.analyze(evt, {})
            if res_tx.get("alert"): self.active_alerts.append(res_tx["alert"])
            
            res_fr = self.fraud_agent.analyze(evt, {})
            if res_fr.get("alert"): self.active_alerts.append(res_fr["alert"])
            
            self._update_db_scores("ACC-581920", "Account", "Transaction", evt)
            
            # Synthesize final Attack Story via Executive Decision Agent
            report = self.exec_agent.synthesize_incident(self.active_alerts, ["DEV-SECOPS-01", "DEV-SWIFT-SRV", "ACC-581920"])
            
            # Save incident report
            import json
            db_incident = DBIncident(
                title=report["title"],
                severity=report["severity"],
                status=report["status"],
                root_cause=report["root_cause"],
                evidence_chain=json.dumps(report["evidence_chain"]),
                mitre_techniques=report["mitre_techniques"],
                confidence_score=report["confidence_score"],
                quantum_risk_factor=report["quantum_risk_factor"],
                business_impact=report["business_impact"],
                suggested_remediation=report["suggested_remediation"]
            )
            self.db.add(db_incident)
            self.db.commit()

        return self.get_status()

    def _update_db_scores(self, entity_id, entity_type, event_type, details):
        prof = self.db.query(DBRiskProfile).filter(DBRiskProfile.entity_id == entity_id).first()
        current = None
        if prof:
            current = {
                "trust_score": prof.trust_score,
                "threat_score": prof.threat_score,
                "fraud_score": prof.fraud_score,
                "quantum_risk_score": prof.quantum_risk_score,
                "identity_confidence": prof.identity_confidence,
                "business_risk": prof.business_risk,
                "operational_risk": prof.operational_risk
            }
            
        new_scores = calculate_scores(event_type, details, current)
        
        if not prof:
            prof = DBRiskProfile(entity_id=entity_id, entity_type=entity_type)
            self.db.add(prof)
            
        prof.trust_score = new_scores["trust_score"]
        prof.threat_score = new_scores["threat_score"]
        prof.fraud_score = new_scores["fraud_score"]
        prof.quantum_risk_score = new_scores["quantum_risk_score"]
        prof.identity_confidence = new_scores["identity_confidence"]
        prof.business_risk = new_scores["business_risk"]
        prof.operational_risk = new_scores["operational_risk"]
        prof.last_updated = datetime.datetime.utcnow()
        self.db.commit()

    def _get_step_description(self, step):
        steps = {
            0: "Baseline State: Bank operating under normal parameters. Trust scores normal (90-100).",
            1: "Threat Stage 1: Endpoint agent detects suspicious PowerShell script on Devon's laptop (T1059.001).",
            2: "Threat Stage 2: Session drift detected. VPN access established using compromised machine from foreign IP (Beijing).",
            3: "Threat Stage 3: Intruder accesses SWIFT Gateway Server, executing lsass.exe for credential dumping (T1003).",
            4: "Threat Stage 4: Cryptographic discovery identifies legacy RSA-2048 backup keys vulnerable to Harvest Now Decrypt Later.",
            5: "Threat Stage 5: System indexes significant insider behavioral drift in working hours, email bursts, and cmd logs.",
            6: "Threat Stage 6: Attack climax. Anomalous high-value RTGS transfer ($950k) initiated. Executive agent generates complete explainable Attack Story."
        }
        return steps.get(step, "Unknown Phase")
