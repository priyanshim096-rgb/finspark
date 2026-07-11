import math
import random

def calculate_bayes_posterior(prior, likelihood_anomalous, likelihood_normal):
    """
    Bayesian Inference calculation for updating threat probability given evidence.
    P(T|E) = (P(E|T) * P(T)) / (P(E|T)*P(T) + P(E|~T)*P(~T))
    """
    numerator = likelihood_anomalous * prior
    denominator = (likelihood_anomalous * prior) + (likelihood_normal * (1.0 - prior))
    if denominator == 0:
        return prior
    return min(1.0, max(0.0, numerator / denominator))

def calculate_context_embedding_distance(v1, v2):
    """
    Cosine distance between two context embeddings representing behavioral states.
    """
    dot_product = sum(a*b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a*a for a in v1))
    magnitude2 = math.sqrt(sum(b*b for b in v2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 1.0
    cosine_similarity = dot_product / (magnitude1 * magnitude2)
    return 1.0 - cosine_similarity

def calculate_scores(event_type, details, current_scores=None):
    """
    Computes updated scores across 7 vector categories based on multi-variate modeling.
    Returns:
      {
        "trust_score": float,            # 0-100 (high is better)
        "threat_score": float,           # 0-100 (low is better)
        "fraud_score": float,            # 0-100 (low is better)
        "quantum_risk_score": float,     # 0-100 (low is better)
        "identity_confidence": float,    # 0-100 (high is better)
        "business_risk": float,          # 0-100 (low is better)
        "operational_risk": float        # 0-100 (low is better)
      }
    """
    # Initialize baseline if not present
    if not current_scores:
        current_scores = {
            "trust_score": 95.0,
            "threat_score": 5.0,
            "fraud_score": 2.0,
            "quantum_risk_score": 10.0,
            "identity_confidence": 98.0,
            "business_risk": 8.0,
            "operational_risk": 5.0
        }
    
    # Base indicators
    threat_factor = 0.0
    fraud_factor = 0.0
    quantum_factor = 0.0
    identity_drift = 0.0
    operational_drift = 0.0
    
    # Process event types mathematically
    if event_type == "Process Creation":
        proc_name = details.get("process_name", "").lower()
        if proc_name in ["powershell.exe", "cmd.exe", "wsmprovhost.exe"]:
            # Threat score escalation via mock Isolation Forest / Autoencoder anomaly
            threat_factor = 45.0
            identity_drift = 15.0
        elif proc_name == "lsass.exe":
            # Credential theft
            threat_factor = 85.0
            identity_drift = 40.0
            
    elif event_type == "VPN":
        success = details.get("success", 1)
        geo = details.get("geolocation", "")
        if not success:
            threat_factor = 30.0
            identity_drift = 25.0
        if "CN" in geo or "RU" in geo:
            # Geographic anomaly (Bayesian update trigger)
            threat_factor = 50.0
            identity_drift = 35.0
            
    elif event_type == "Transaction":
        amount = details.get("amount", 0.0)
        channel = details.get("channel", "")
        is_fraud = details.get("is_fraud", 0)
        
        # Fraud risk calculation using sigmoidal transaction scale
        # S(x) = L / (1 + e^(-k*(x-x0)))
        x0 = 100000.0  # Inflection point: $100k
        k = 0.00001
        sig_amount = 1.0 / (1.0 + math.exp(-k * (amount - x0)))
        
        if is_fraud or amount > 500000:
            fraud_factor = 60.0 + (30.0 * sig_amount)
            threat_factor = 20.0
        else:
            fraud_factor = 5.0 + (10.0 * sig_amount)
            
    elif event_type == "Quantum Cryptography":
        algo = details.get("algorithm", "")
        key_size = details.get("key_size", 2048)
        expiry_days = details.get("expiry_days", 365)
        tls_version = details.get("tls_version", "TLSv1.2")
        
        # Quantum risk math model
        # HNDL Risk = w1*AlgoRisk + w2*KeySizeVulnerability + w3*TlsVersionLegacy
        algo_risk = 0.9 if algo in ["RSA", "ECC", "ECDSA"] else 0.1
        size_risk = 0.8 if (algo == "RSA" and key_size <= 2048) else 0.2
        tls_risk = 0.9 if tls_version in ["TLSv1.0", "TLSv1.1"] else (0.4 if tls_version == "TLSv1.2" else 0.1)
        
        quantum_factor = (0.5 * algo_risk + 0.3 * size_risk + 0.2 * tls_risk) * 100
        if expiry_days < 0:
            operational_drift = 35.0
            
    elif event_type == "Insider Threat":
        wh_drift = details.get("working_hours_drift", 0.0)
        ev_drift = details.get("email_volume_drift", 0.0)
        cmd_drift = details.get("cmd_anomaly_drift", 0.0)
        
        # Temporal anomaly score integration
        threat_factor = (0.3 * (wh_drift / 100.0) + 0.3 * (ev_drift / 100.0) + 0.4 * (cmd_drift / 100.0)) * 100
        threat_factor = min(90.0, max(0.0, threat_factor))
        identity_drift = min(60.0, max(0.0, wh_drift * 0.5))

    # Apply Bayesian update to threat score
    prior_threat = current_scores["threat_score"] / 100.0
    # If threat_factor is positive, evidence is anomalous.
    l_anomalous = 0.8 if threat_factor > 10 else 0.2
    l_normal = 0.1 if threat_factor > 10 else 0.9
    updated_threat_prob = calculate_bayes_posterior(prior_threat, l_anomalous, l_normal)
    
    # Assemble and bound new scores
    new_threat = min(100.0, max(0.0, updated_threat_prob * 100.0 + threat_factor * 0.15))
    new_fraud = min(100.0, max(0.0, current_scores["fraud_score"] * 0.8 + fraud_factor * 0.2))
    new_quantum = min(100.0, max(0.0, current_scores["quantum_risk_score"] * 0.7 + quantum_factor * 0.3))
    new_identity = min(100.0, max(0.0, current_scores["identity_confidence"] - identity_drift * 0.4))
    
    # Calculate Trust score based on weighted degradation factors
    # Trust = 100 - (0.3*Threat + 0.25*Fraud + 0.2*Quantum + 0.25*(100-Identity))
    trust_degradation = (
        0.30 * new_threat +
        0.25 * new_fraud +
        0.15 * new_quantum +
        0.30 * (100.0 - new_identity)
    )
    new_trust = min(100.0, max(0.0, 100.0 - trust_degradation))
    
    # Business Risk & Operational Risk formulas
    new_biz = min(100.0, max(0.0, (new_threat * 0.4 + new_fraud * 0.4 + (100.0 - new_trust) * 0.2)))
    new_ops = min(100.0, max(0.0, (new_threat * 0.3 + operational_drift * 0.5 + (new_quantum * 0.2))))
    
    return {
        "trust_score": round(new_trust, 2),
        "threat_score": round(new_threat, 2),
        "fraud_score": round(new_fraud, 2),
        "quantum_risk_score": round(new_quantum, 2),
        "identity_confidence": round(new_identity, 2),
        "business_risk": round(new_biz, 2),
        "operational_risk": round(new_ops, 2)
    }
