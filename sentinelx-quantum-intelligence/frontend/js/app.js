// API Base URL Detection with Local File Fallback
const isLocalFile = window.location.protocol === 'file:';
const host = isLocalFile ? '127.0.0.1' : window.location.hostname;
const API_BASE = `http://${host}:8000`;
const WS_BASE = `ws://${host}:8000/ws`;

let networkGraph = null;
let wsConn = null;

// System Clock
function updateClock() {
  const clockEl = document.getElementById("current-system-time");
  if (clockEl) {
    clockEl.innerText = new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";
  }
}
setInterval(updateClock, 1000);
updateClock();

// View switcher
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".dashboard-view").forEach(v => v.classList.remove("active"));
    
    item.classList.add("active");
    const target = item.getAttribute("data-target");
    const view = document.getElementById(target);
    if (view) {
      view.classList.add("active");
    }
    
    // Fetch fresh data based on view
    if (target === "view-graph") {
      loadGraph();
    } else if (target === "view-quantum") {
      loadQuantumInventory();
    } else if (target === "view-actions") {
      loadAuditLogs();
    }
  });
});

// Load and populate data
async function loadStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/status`);
    const status = await res.json();
    
    // Update labels
    document.getElementById("summary-step-indicator").innerText = `Step ${status.step}/${status.max_steps}`;
    document.getElementById("sim-step-title").innerText = `Phase ${status.step}: ` + status.description.split(":")[0];
    document.getElementById("sim-step-desc").innerText = status.description;
    
    const progIndicator = document.getElementById("sim-progress-indicator");
    if (progIndicator) {
      progIndicator.innerText = `Step ${status.step}/${status.max_steps}`;
    }
    
    // Render step checklist in simulator tab
    renderSimulatorTimeline(status.step);
  } catch (err) {
    console.error("Error loading status:", err);
  }
}

async function loadRiskScores() {
  try {
    const res = await fetch(`${API_BASE}/api/risk-scores`);
    const scores = await res.json();
    
    const tbody = document.getElementById("risk-profiles-table-body");
    tbody.innerHTML = "";
    
    if (scores.length > 0) {
      // Pick first element (or standard entity Devon Miller EMP-9402) to show metrics in top boxes
      const devon = scores.find(s => s.entity_id === "EMP-9402") || scores[0];
      const server = scores.find(s => s.entity_id === "DEV-SWIFT-SRV") || scores[0];
      
      document.getElementById("metric-trust").innerText = devon.trust_score.toFixed(1);
      document.getElementById("metric-threat").innerText = devon.threat_score.toFixed(1);
      document.getElementById("metric-fraud").innerText = devon.fraud_score.toFixed(1);
      document.getElementById("metric-quantum").innerText = server.quantum_risk_score.toFixed(1);
      document.getElementById("metric-identity").innerText = devon.identity_confidence.toFixed(1);
      
      // Update styling based on thresholds
      updateMetricColors("metric-trust", devon.trust_score, true);
      updateMetricColors("metric-threat", devon.threat_score, false);
      updateMetricColors("metric-fraud", devon.fraud_score, false);
      updateMetricColors("metric-quantum", server.quantum_risk_score, false);
      updateMetricColors("metric-identity", devon.identity_confidence, true);
    }
    
    scores.forEach(row => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/40 hover:bg-slate-800/20";
      
      let trustColor = row.trust_score > 70 ? "text-emerald-400" : (row.trust_score > 40 ? "text-amber-400" : "text-rose-500");
      let threatColor = row.threat_score < 30 ? "text-slate-400" : (row.threat_score < 70 ? "text-amber-400" : "text-rose-500 font-bold");
      
      tr.innerHTML = `
        <td class="py-3 px-4 font-mono font-bold text-slate-300">${row.entity_id}</td>
        <td class="py-3 px-4 text-slate-400">${row.entity_type}</td>
        <td class="py-3 px-4 font-mono ${trustColor}">${row.trust_score.toFixed(1)}</td>
        <td class="py-3 px-4 font-mono ${threatColor}">${row.threat_score.toFixed(1)}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${row.fraud_score.toFixed(1)}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${row.quantum_risk_score.toFixed(1)}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${row.identity_confidence.toFixed(1)}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${row.business_risk.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading risk scores:", err);
  }
}

function updateMetricColors(id, val, isHighGood) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "metric-value ";
  if (isHighGood) {
    if (val > 70) el.classList.add("neon-green");
    else if (val > 45) el.classList.add("neon-amber");
    else el.classList.add("neon-red");
  } else {
    if (val < 30) el.classList.add("neon-blue");
    else if (val < 65) el.classList.add("neon-amber");
    else el.classList.add("neon-red");
  }
}

async function loadIncidents() {
  try {
    const res = await fetch(`${API_BASE}/api/incidents`);
    const incidents = await res.json();
    
    const emptyMsg = document.getElementById("no-incidents-msg");
    const container = document.getElementById("incident-container");
    
    if (incidents.length === 0) {
      emptyMsg.classList.remove("hidden");
      container.classList.add("hidden");
      return;
    }
    
    emptyMsg.classList.add("hidden");
    container.classList.remove("hidden");
    
    // Populate latest incident details
    const inc = incidents[incidents.length - 1];
    document.getElementById("inc-title").innerText = inc.title;
    document.getElementById("inc-severity").innerText = inc.severity;
    document.getElementById("inc-severity").className = `badge badge-${inc.severity.toLowerCase()}`;
    document.getElementById("inc-rc").innerText = inc.root_cause;
    document.getElementById("inc-mitre").innerText = inc.mitre_techniques;
    document.getElementById("inc-confidence").innerText = `${inc.confidence_score.toFixed(1)}%`;
    document.getElementById("inc-assets").innerText = inc.affected_assets;
    document.getElementById("inc-next").innerText = inc.predicted_next_attacker_action;
    document.getElementById("inc-counterfactual").innerText = inc.counterfactual_explanation;
    
    // Trigger action suggestions
    const remediationContainer = document.getElementById("inc-evidence");
    remediationContainer.innerHTML = "";
    
    const evidence = JSON.parse(inc.evidence_chain);
    evidence.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="text-cyan-400 font-bold">[${item.agent}]</span> ${item.finding}: ${item.details}`;
      remediationContainer.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading incidents:", err);
  }
}

// Live Vis.js Network Graph setup
async function loadGraph() {
  try {
    const res = await fetch(`${API_BASE}/api/graph`);
    const data = await res.json();
    
    document.getElementById("graph-meta").innerText = `NODES: ${data.nodes.length} | EDGES: ${data.edges.length}`;
    
    // Process Nodes for Vis.js format
    const visNodes = data.nodes.map(node => {
      let color = "#1e293b";
      let shape = "dot";
      
      if (node.type === "Employee") { color = "#3b82f6"; shape = "square"; }
      else if (node.type === "Server") { color = node.health === "Critical" ? "#ef4444" : "#10b981"; }
      else if (node.type === "External IP") { color = "#f59e0b"; }
      else if (node.type === "Device") { color = node.health === "Vulnerable" ? "#ef4444" : "#6366f1"; }
      else if (node.type === "Encryption Key") { color = "#06b6d4"; shape = "diamond"; }
      else if (node.type === "Account") { color = "#10b981"; shape = "database"; }
      
      // Node custom border / shadow highlighting active threat
      let border = "#0f172a";
      if (node.health === "Critical" || node.health === "Vulnerable" || node.status === "Frozen") {
        border = "#ff007f";
      }
      
      return {
        id: node.id,
        label: `${node.label}\n[${node.type}]`,
        color: {
          background: color,
          border: border,
          highlight: { background: "#00ffff", border: "#ffffff" }
        },
        shape: shape,
        font: {
          color: "#f1f5f9",
          size: 10,
          face: "Fira Code",
          background: "rgba(5, 7, 15, 0.85)",
          strokeWidth: 2,
          strokeColor: "#0a0f1d"
        },
        borderWidth: 2,
        shadow: true
      };
    });
    
    // Process Edges for Vis.js
    const visEdges = data.edges.map(edge => {
      let color = "#334155";
      let width = 1;
      let arrows = "to";
      
      if (edge.type === "ANOMALOUS_TRANSFER" || edge.type === "EXPOSES_TRAFFIC" || edge.type === "DUMPED") {
        color = "#ff3838";
        width = 3;
      }
      
      return {
        from: edge.source,
        to: edge.target,
        label: edge.type,
        color: color,
        width: width,
        arrows: arrows,
        font: { 
          color: "#94a3b8", 
          size: 8, 
          align: "horizontal", 
          face: "Fira Code",
          background: "rgba(5, 7, 15, 0.7)"
        }
      };
    });
    
    const container = document.getElementById("graph-container");
    const graphData = { nodes: new vis.DataSet(visNodes), edges: new vis.DataSet(visEdges) };
    const options = {
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -180,
          centralGravity: 0.015,
          springLength: 200,
          springConstant: 0.04
        },
        maxVelocity: 50,
        solver: "forceAtlas2Based",
        timestep: 0.35,
        stabilization: { iterations: 200 }
      }
    };
    
    networkGraph = new vis.Network(container, graphData, options);
    
    // Load textual representation in box
    const list = document.getElementById("active-edges-list");
    list.innerHTML = "";
    data.edges.forEach(e => {
      const li = document.createElement("li");
      li.className = e.type.includes("ANOMALOUS") ? "text-red-400 font-bold" : "text-slate-400";
      li.innerHTML = `&gt; [${new Date(e.timestamp).toISOString().substring(11, 19)}] Node (${e.source}) -- ${e.type} --&gt; Node (${e.target})`;
      list.appendChild(li);
    });
    
  } catch (err) {
    console.error("Error drawing graph:", err);
  }
}

// Quantum Readiness Hub
async function loadQuantumInventory() {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/status`);
    const status = await res.json();
    
    // Scale risk indices dynamically with simulator steps
    const step = status.step;
    const readyIdx = 45.8 + (step * 2);
    const harvestRisk = 72.4 + (step * 4);
    const migPriority = 85.0 + (step * 2.1);
    
    document.getElementById("q-ready-index").innerText = `${readyIdx.toFixed(1)}%`;
    document.getElementById("q-harvest-risk").innerText = `${harvestRisk.toFixed(1)}%`;
    document.getElementById("q-migration-priority").innerText = migPriority.toFixed(1);
    
    const tbody = document.getElementById("quantum-inventory-table-body");
    tbody.innerHTML = "";
    
    const inventory = [
      { id: "KEY-RSA-01", algo: "RSA", size: 2048, tls: "TLSv1.1", harvest: "Critical (92%)", priority: "High (89)" },
      { id: "CERT-SWIFT-TLS", algo: "ECC-Secp256r1", size: 256, tls: "TLSv1.2", harvest: "Medium (60%)", priority: "Medium (72)" },
      { id: "KEY-PQC-BACKUP", algo: "Kyber768", size: 3072, tls: "TLSv1.3", harvest: "Quantum-Safe (5%)", priority: "None (10)" },
      { id: "KEY-SIGN-01", algo: "ECDSA", size: 384, tls: "TLSv1.2", harvest: "Medium (58%)", priority: "Medium (68)" }
    ];
    
    inventory.forEach(item => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/40 hover:bg-slate-800/10";
      
      let badge = item.harvest.includes("Critical") ? "text-rose-400" : (item.harvest.includes("Quantum-Safe") ? "text-emerald-400 font-bold" : "text-amber-400");
      
      tr.innerHTML = `
        <td class="py-2 px-3 font-mono font-bold text-slate-300">${item.id}</td>
        <td class="py-2 px-3 text-slate-400">${item.algo}</td>
        <td class="py-2 px-3 font-mono text-slate-400">${item.size}</td>
        <td class="py-2 px-3 font-mono text-slate-400">${item.tls}</td>
        <td class="py-2 px-3 font-mono ${badge}">${item.harvest}</td>
        <td class="py-2 px-3 font-mono text-slate-400">${item.priority}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading quantum details:", err);
  }
}

// Simulator Timeline steps rendering
function renderSimulatorTimeline(activeStep) {
  const container = document.getElementById("simulator-steps-progress");
  if (!container) return;
  
  const stepTitles = [
    "Baseline Profile Check",
    "Anomalous PowerShell Execution",
    "Tor-IP VPN Tunnel Connection",
    "Gateway Server Credential dumping (lsass)",
    "Legacy RSA Crypto Harvesting Risks Detected",
    "Insider Threat Behavioral Metrics Drift",
    "Anomalous Wire Transfer Climax"
  ];
  
  container.innerHTML = "";
  
  for (let i = 0; i <= 6; i++) {
    const isDone = i <= activeStep;
    const isCurrent = i === activeStep;
    
    const div = document.createElement("div");
    div.className = "relative mb-4";
    
    let bulletColor = "bg-slate-800 border-slate-700";
    let textColor = "text-slate-500";
    
    if (isCurrent) {
      bulletColor = "bg-blue-600 border-blue-400 animate-pulse";
      textColor = "text-blue-400 font-bold";
    } else if (isDone) {
      bulletColor = "bg-emerald-500 border-emerald-400";
      textColor = "text-slate-300";
    }
    
    div.innerHTML = `
      <span class="absolute -left-10 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 ${bulletColor}">
        ${isDone && !isCurrent ? '<i class="fa-solid fa-check text-[10px] text-white"></i>' : ''}
      </span>
      <h4 class="text-xs font-mono uppercase ${textColor}">${stepTitles[i]}</h4>
    `;
    container.appendChild(div);
  }
}

// Autonomous actions audit table
async function loadAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/audit-logs`);
    const logs = await res.json();
    
    const tbody = document.getElementById("audit-logs-table-body");
    tbody.innerHTML = "";
    
    logs.forEach(log => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/40";
      tr.innerHTML = `
        <td class="py-2 px-3 text-slate-500 font-mono">${new Date(log.timestamp).toISOString().substring(11, 19)}</td>
        <td class="py-2 px-3 font-semibold text-cyan-400 font-mono">${log.action}</td>
        <td class="py-2 px-3 text-slate-400">${log.details}</td>
        <td class="py-2 px-3 text-emerald-400 font-mono">${log.status}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
  }
}

// Event Listeners for Sandbox controllers
document.getElementById("btn-advance-sim").addEventListener("click", advanceSimulator);
const btnTab = document.getElementById("btn-advance-sim-tab");
if (btnTab) {
  btnTab.addEventListener("click", advanceSimulator);
}

async function advanceSimulator() {
  try {
    const res = await fetch(`${API_BASE}/api/simulator/advance`, { method: "POST" });
    const data = await res.json();
    
    // Refresh page components
    loadStatus();
    loadRiskScores();
    loadIncidents();
    loadGraph();
  } catch (err) {
    console.error("Error advancing simulation:", err);
  }
}

document.getElementById("btn-reset-sim").addEventListener("click", async () => {
  try {
    await fetch(`${API_BASE}/api/simulator/reset`, { method: "POST" });
    
    loadStatus();
    loadRiskScores();
    loadIncidents();
    loadGraph();
    loadAuditLogs();
    
    alert("Simulator reset to Baseline. Entity scores updated.");
  } catch (err) {
    console.error("Error resetting simulation:", err);
  }
});

// Mitigation Action center trigger hooks
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-trigger-mitigation");
  if (btn) {
    const action = btn.getAttribute("data-action");
    const target = btn.getAttribute("data-target");
    
    try {
      const res = await fetch(`${API_BASE}/api/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target })
      });
      const data = await res.json();
      
      alert(data.details);
      loadAuditLogs();
      loadGraph(); // Refresh network topology to reflect change
    } catch (err) {
      console.error("Error firing mitigation action:", err);
    }
  }
});

// AI Copilot controller hooks
const copilotInput = document.getElementById("copilot-input");
const copilotBtn = document.getElementById("btn-copilot-submit");
const copilotMessages = document.getElementById("copilot-messages");

async function submitCopilotQuery(text) {
  if (!text.trim()) return;
  
  // Append user message
  const userDiv = document.createElement("div");
  userDiv.className = "mb-2 text-slate-300 font-bold";
  userDiv.innerHTML = `<span class="text-emerald-400 font-bold">[YOU]</span> ${text}`;
  copilotMessages.appendChild(userDiv);
  
  copilotInput.value = "";
  
  try {
    const res = await fetch(`${API_BASE}/api/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text })
    });
    const data = await res.json();
    
    const botDiv = document.createElement("div");
    botDiv.className = "mb-4 text-slate-400 pl-4 border-l border-cyan-800";
    
    let evidenceHtml = "";
    if (data.evidence.length > 0) {
      evidenceHtml = `<div class="text-xs text-rose-400 font-mono mt-1">Evidence Chain:</div>` + 
        data.evidence.map(e => `  - Node(${e.source}) ${e.relation} Node(${e.target})`).join("<br>");
    }
    
    botDiv.innerHTML = `
      <span class="text-cyan-400 font-bold">[SentinelX]</span> ${data.answer}<br>
      ${evidenceHtml}<br>
      <span class="text-xs text-slate-500 font-mono">Suggested action: ${data.recommendation}</span>
    `;
    copilotMessages.appendChild(botDiv);
    copilotMessages.scrollTop = copilotMessages.scrollHeight;
    
  } catch (err) {
    console.error("Error submitting copilot query:", err);
  }
}

copilotBtn.addEventListener("click", () => submitCopilotQuery(copilotInput.value));
copilotInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitCopilotQuery(copilotInput.value);
  }
});

// Quick query triggers
document.querySelectorAll(".quick-query-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.innerText.replace(/"/g, "").trim();
    submitCopilotQuery(text);
  });
});

// Establish WebSocket pipeline for real-time risk updates
function setupWebSocket() {
  wsConn = new WebSocket(WS_BASE);
  wsConn.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.event === "SIMULATION_UPDATE") {
      loadStatus();
      loadRiskScores();
      loadIncidents();
      loadGraph();
    }
  };
  wsConn.onclose = () => {
    console.warn("WebSocket closed. Attempting reconnect in 3s...");
    setTimeout(setupWebSocket, 3000);
  };
}

// Initial Boot
loadStatus();
loadRiskScores();
loadIncidents();
loadGraph();
loadAuditLogs();
setupWebSocket();
