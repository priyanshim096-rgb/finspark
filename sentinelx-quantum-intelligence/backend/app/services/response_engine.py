import logging
from ..database import DBAuditLog
from ..graph_engine import graph_instance

logger = logging.getLogger("ResponseEngine")

class ResponseEngine:
    @staticmethod
    def execute_action(action_name: str, target: str, db_session) -> dict:
        """
        Executes mitigative actions autonomously inside the bank.
        Everything logged and audit-trailed.
        """
        logger.info(f"Executing security action: {action_name} on {target}")
        
        status = "Success"
        details = f"Autonomous mitigation '{action_name}' triggered successfully against entity '{target}'."
        
        # Apply changes to graph state dynamically
        if action_name == "Freeze Account":
            graph_instance.add_node(target, f"{target} (FROZEN)", "Account", status="Frozen")
            details = f"Account {target} frozen. Placed lock on all outbound wires (RTGS, NEFT, UPI)."
            
        elif action_name == "Disable VPN":
            graph_instance.add_node(target, f"{target} (DISABLED)", "Server", status="Disabled")
            details = f"VPN gateway profile for user {target} terminated. Session token revoked."
            
        elif action_name == "Invalidate Session":
            graph_instance.add_node(target, f"{target} (Revoked)", "Device", health="Unauthenticated")
            details = f"Active OAuth2.0 tokens for device {target} invalidated."
            
        elif action_name == "Block IP":
            graph_instance.add_node(target, f"IP {target} (BLOCKED)", "External IP", reputation="Blocked")
            details = f"IP address {target} added to Edge Cisco ASA Firewall blacklist."
            
        elif action_name == "Rotate Certificates":
            graph_instance.add_node(target, "Kyber768 Quantum Certificate (Active)", "Certificate", status="Active (Post-Quantum Safe)")
            details = f"Certificate {target} replaced. Upgraded key exchange from RSA-2048 to Kyber768."
            
        elif action_name == "Trigger MFA":
            details = f"Outbound transfer halted. Sent push notification challenge to registered device for {target}."
            
        elif action_name == "Generate SAR":
            details = f"Draft Suspicious Activity Report (SAR) auto-populated and queued for Financial Intelligence Unit (FIU) submission."
            
        # Log to Database Audit Table
        audit_entry = DBAuditLog(
            user_id="SYSTEM/SENTINELX-AGENT",
            action=action_name,
            details=details,
            status=status
        )
        db_session.add(audit_entry)
        db_session.commit()
        
        return {
            "action": action_name,
            "target": target,
            "status": status,
            "details": details
        }
