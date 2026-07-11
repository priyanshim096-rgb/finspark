import threading
import datetime

class DynamicKnowledgeGraph:
    def __init__(self):
        self.lock = threading.Lock()
        self.nodes = {}  # id -> {label, type, properties}
        self.edges = []  # list of {source, target, type, weight, timestamp}
        self._initialize_baseline_graph()

    def _initialize_baseline_graph(self):
        # Insert initial nodes
        baseline_nodes = [
            # Employees & Accounts
            {"id": "EMP-9402", "label": "Devon Miller (SecOps)", "type": "Employee", "status": "Active", "dept": "Security"},
            {"id": "EMP-1082", "label": "Sarah Jenkins (SW Swift Admin)", "type": "Employee", "status": "Active", "dept": "SWIFT Ops"},
            {"id": "ACC-581920", "label": "Main SWIFT Settlement Account", "type": "Account", "balance": "$45,200,000"},
            {"id": "ACC-992019", "label": "External Clearing Account", "type": "Account", "balance": "$12,400,000"},
            
            # Devices & Servers
            {"id": "DEV-SECOPS-01", "label": "Devon's Laptop (ThinkPad X1)", "type": "Device", "os": "Windows 11", "health": "Secured"},
            {"id": "DEV-SWIFT-SRV", "label": "SWIFT Gateway Server", "type": "Server", "os": "RHEL 8.6", "health": "Critical Alert"},
            {"id": "IP-185.220.101.5", "label": "Tor Exit Node IP", "type": "External IP", "reputation": "Malicious"},
            {"id": "IP-10.240.12.80", "label": "Internal Subnet VPN Gateway", "type": "Server", "status": "Active"},
            
            # Cryptographic Assets
            {"id": "KEY-RSA-01", "label": "RSA-2048 Cryptographic Key (Active)", "type": "Encryption Key", "strength": "Weak (Harvest Hazard)"},
            {"id": "CERT-SWIFT-TLS", "label": "SWIFT TLS Certificate (Expired 3d ago)", "type": "Certificate", "expiry": "Expired"},
            
            # Malware & Threat Actor (discovered dynamically later, but baseline exist)
            {"id": "ACTOR-SILENT-FADE", "label": "UNC3829 (SilentFade Variant)", "type": "Threat Actor", "origin": "State-sponsored"},
        ]
        
        for node in baseline_nodes:
            self.nodes[node["id"]] = node

        # Baseline edges
        baseline_edges = [
            {"source": "EMP-9402", "target": "DEV-SECOPS-01", "type": "OWNS", "weight": 1.0},
            {"source": "EMP-1082", "target": "DEV-SWIFT-SRV", "type": "ADMINISTERS", "weight": 1.0},
            {"source": "DEV-SWIFT-SRV", "target": "ACC-581920", "type": "ACCESSES", "weight": 0.8},
            {"source": "DEV-SWIFT-SRV", "target": "CERT-SWIFT-TLS", "type": "USES_CERT", "weight": 1.0},
            {"source": "DEV-SWIFT-SRV", "target": "KEY-RSA-01", "type": "ENCRYPTED_WITH", "weight": 1.0},
            {"source": "ACC-581920", "target": "ACC-992019", "type": "TRANSFERS_TO", "weight": 0.3},
        ]
        
        for edge in baseline_edges:
            edge["timestamp"] = datetime.datetime.utcnow().isoformat()
            self.edges.append(edge)

    def add_node(self, node_id, label, node_type, **properties):
        with self.lock:
            self.nodes[node_id] = {
                "id": node_id,
                "label": label,
                "type": node_type,
                **properties
            }
            return self.nodes[node_id]

    def add_edge(self, source, target, edge_type, weight=1.0):
        with self.lock:
            # Check if nodes exist, if not create placeholder
            if source not in self.nodes:
                self.nodes[source] = {"id": source, "label": source, "type": "Unknown"}
            if target not in self.nodes:
                self.nodes[target] = {"id": target, "label": target, "type": "Unknown"}
                
            edge = {
                "source": source,
                "target": target,
                "type": edge_type,
                "weight": weight,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
            # Avoid exact duplicate edges added in quick succession
            exists = False
            for e in self.edges[-15:]:
                if e["source"] == source and e["target"] == target and e["type"] == edge_type:
                    exists = True
                    break
            
            if not exists:
                self.edges.append(edge)
            return edge

    def get_graph(self):
        with self.lock:
            return {
                "nodes": list(self.nodes.values()),
                "edges": self.edges
            }

    def clear_threats(self):
        with self.lock:
            # Re-initialize to baseline
            self.nodes.clear()
            self.edges.clear()
            self._initialize_baseline_graph()

# Singleton instance of the dynamic knowledge graph
graph_instance = DynamicKnowledgeGraph()
