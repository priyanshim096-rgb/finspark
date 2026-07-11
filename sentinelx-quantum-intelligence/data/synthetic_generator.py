import os
import csv
import random
import uuid
from datetime import datetime, timedelta

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def ensure_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def generate_transactions(count=500):
    filepath = os.path.join(DATA_DIR, "transactions.csv")
    headers = ["timestamp", "tx_id", "source_acc", "dest_acc", "amount", "channel", "location", "device_id", "is_fraud", "risk_score"]
    channels = ["UPI", "NEFT", "RTGS", "IMPS", "Credit Card", "ATM", "Internet Banking", "Mobile Banking"]
    locations = ["Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad", "Kolkata", "London", "New York", "Singapore"]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(count):
            tx_time = base_time + timedelta(minutes=random.randint(1, 10080))
            tx_id = f"TX-{uuid.uuid4().hex[:8].upper()}"
            src = f"ACC-{random.randint(100000, 999999)}"
            dest = f"ACC-{random.randint(100000, 999999)}"
            amount = round(random.uniform(10.0, 1000000.0), 2)
            channel = random.choice(channels)
            loc = random.choice(locations)
            dev = f"DEV-{uuid.uuid4().hex[:6].upper()}"
            
            # Introduce anomaly patterns
            is_fraud = 0
            risk_score = round(random.uniform(5.0, 35.0), 2)
            if amount > 800000 and random.random() < 0.15:
                # Large transfer, anomalous
                risk_score = round(random.uniform(70.0, 95.0), 2)
                if random.random() < 0.5:
                    is_fraud = 1
            elif loc in ["London", "New York", "Singapore"] and random.random() < 0.08:
                # International location, potential anomaly
                risk_score = round(random.uniform(60.0, 85.0), 2)
            
            writer.writerow([tx_time.isoformat(), tx_id, src, dest, amount, channel, loc, dev, is_fraud, risk_score])
    print(f"Generated transactions.csv at {filepath}")

def generate_cyber_telemetry(count=400):
    filepath = os.path.join(DATA_DIR, "cyber_telemetry.csv")
    headers = ["timestamp", "event_id", "source_ip", "dest_ip", "process_name", "event_type", "action", "device_id", "username", "mitre_technique", "alert_level"]
    processes = ["powershell.exe", "cmd.exe", "svchost.exe", "chrome.exe", "lsass.exe", "wsmprovhost.exe", "sqlservr.exe"]
    event_types = ["Process Creation", "Network Connection", "Registry Modify", "Privilege Escalation", "File Read", "File Write"]
    mitre_mappings = {
        "powershell.exe": "T1059.001 (Command and Scripting Interpreter: PowerShell)",
        "lsass.exe": "T1003 (Credential Dumping)",
        "sqlservr.exe": "T1048 (Exfiltration Over Alternative Protocol)",
        "wsmprovhost.exe": "T1021.006 (Remote Services: Windows Remote Management)"
    }
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(count):
            ev_time = base_time + timedelta(minutes=random.randint(1, 10080))
            ev_id = f"EV-{uuid.uuid4().hex[:8].upper()}"
            src_ip = f"10.240.{random.randint(1, 254)}.{random.randint(1, 254)}"
            dest_ip = f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}"
            proc = random.choice(processes)
            ev_type = random.choice(event_types)
            action = "Allowed"
            alert_level = "Informational"
            mitre = "None"
            
            if proc in mitre_mappings and random.random() < 0.15:
                mitre = mitre_mappings[proc]
                alert_level = random.choice(["Medium", "High", "Critical"])
                action = "Blocked" if alert_level == "Critical" else "Detected"
                
            dev = f"DEV-{uuid.uuid4().hex[:6].upper()}"
            user = f"EMP-{random.randint(1000, 9999)}"
            
            writer.writerow([ev_time.isoformat(), ev_id, src_ip, dest_ip, proc, ev_type, action, dev, user, mitre, alert_level])
    print(f"Generated cyber_telemetry.csv at {filepath}")

def generate_vpn_logs(count=300):
    filepath = os.path.join(DATA_DIR, "vpn_logs.csv")
    headers = ["timestamp", "session_id", "username", "ip_address", "geolocation", "device_fingerprint", "action", "success"]
    geos = ["Mumbai, IN", "Delhi, IN", "Bangalore, IN", "London, UK", "Frankfurt, DE", "Beijing, CN", "Moscow, RU"]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(count):
            vpn_time = base_time + timedelta(minutes=random.randint(1, 10080))
            session_id = f"VPN-{uuid.uuid4().hex[:8].upper()}"
            user = f"EMP-{random.randint(1000, 9999)}"
            ip = f"103.45.{random.randint(10, 250)}.{random.randint(1, 254)}"
            geo = random.choice(geos)
            fp = f"FP-{uuid.uuid4().hex[:10].upper()}"
            action = "Login"
            success = 1
            
            if geo in ["Beijing, CN", "Moscow, RU"] and random.random() < 0.3:
                success = 0
                action = "Failed Login Blocked"
                
            writer.writerow([vpn_time.isoformat(), session_id, user, ip, geo, fp, action, success])
    print(f"Generated vpn_logs.csv at {filepath}")

def generate_quantum_indicators(count=150):
    filepath = os.path.join(DATA_DIR, "quantum_indicators.csv")
    headers = ["timestamp", "key_id", "algorithm", "key_size", "certificate_expiry", "tls_version", "harvest_risk_index", "migration_priority_index"]
    algos = ["RSA", "ECC", "ECDSA", "Ed25519", "Kyber768", "Dilithium3"]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(count):
            q_time = base_time + timedelta(minutes=random.randint(1, 10080))
            key_id = f"KEY-{uuid.uuid4().hex[:8].upper()}"
            algo = random.choices(algos, weights=[45, 35, 10, 5, 3, 2])[0]
            
            if algo == "RSA":
                key_size = random.choice([1024, 2048, 4096])
            elif algo in ["ECC", "ECDSA", "Ed25519"]:
                key_size = random.choice([256, 384, 521])
            else: # Kyber/Dilithium
                key_size = 3072 # Quantum-safe equivalent strength representation
                
            expiry = (datetime.now() + timedelta(days=random.randint(-30, 730))).isoformat()
            tls_version = random.choice(["TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"])
            
            # Math scoring for Harvest Risk and Migration Priority
            harvest_risk = 0.0
            if algo in ["RSA", "ECC", "ECDSA"] and key_size <= 2048:
                harvest_risk = round(random.uniform(65.0, 98.0), 2)
            else:
                harvest_risk = round(random.uniform(5.0, 25.0), 2)
                
            migration_priority = 0.0
            if harvest_risk > 60.0 or tls_version in ["TLSv1.0", "TLSv1.1"]:
                migration_priority = round(random.uniform(70.0, 99.0), 2)
            else:
                migration_priority = round(random.uniform(10.0, 45.0), 2)
                
            writer.writerow([q_time.isoformat(), key_id, algo, key_size, expiry, tls_version, harvest_risk, migration_priority])
    print(f"Generated quantum_indicators.csv at {filepath}")

def generate_insider_threat_drift(count=200):
    filepath = os.path.join(DATA_DIR, "insider_threat_drift.csv")
    headers = ["timestamp", "employee_id", "working_hours_drift", "email_volume_drift", "keyboard_cadence_drift", "cmd_anomaly_drift"]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(count):
            t = base_time + timedelta(minutes=random.randint(1, 10080))
            emp_id = f"EMP-{random.randint(1000, 9999)}"
            # Drift represented as % deviation
            wh_drift = round(random.uniform(-10.0, 120.0), 2)
            ev_drift = round(random.uniform(-20.0, 300.0), 2)
            kc_drift = round(random.uniform(-15.0, 80.0), 2)
            cmd_drift = round(random.uniform(0.0, 95.0), 2)
            
            writer.writerow([t.isoformat(), emp_id, wh_drift, ev_drift, kc_drift, cmd_drift])
    print(f"Generated insider_threat_drift.csv at {filepath}")

if __name__ == "__main__":
    ensure_dir()
    generate_transactions()
    generate_cyber_telemetry()
    generate_vpn_logs()
    generate_quantum_indicators()
    generate_insider_threat_drift()
