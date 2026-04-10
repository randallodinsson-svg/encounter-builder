// apexops.js
// APEXOPS v1 — Runtime Inspector for APEXSIM

export class ApexOps {
  constructor(rootElementId) {
    this.root = document.getElementById(rootElementId);
    if (!this.root) {
      console.error(`APEXOPS: Root element #${rootElementId} not found.`);
      return;
    }

    this.root.innerHTML = `
      <div id="apexops-container" style="font-family: monospace; padding: 20px; color: #eee; background:#111;">
        <h2>APEXOPS Runtime Inspector</h2>
        <div id="ops-summary" style="margin-bottom:20px;"></div>
        <div id="ops-global" style="margin-bottom:20px;"></div>
        <div id="ops-actors" style="margin-bottom:20px;"></div>
        <div id="ops-timeline" style="margin-bottom:20px;"></div>
        <div id="ops-logs" style="margin-bottom:20px;"></div>
        <div id="ops-outcome" style="margin-bottom:20px; font-weight:bold;"></div>
      </div>
    `;
  }

  loadSimulationResult(result) {
    if (!result) {
      console.error("APEXOPS: No simulation result provided.");
      return;
    }

    this.renderSummary(result);
    this.renderGlobalState(result.finalState.global);
    this.renderActors(result.finalState.actors);
    this.renderTimeline(result.logs);
    this.renderLogs(result.logs);
    this.renderOutcome(result.outcome);
  }

  renderSummary(result) {
    const el = document.getElementById("ops-summary");
    el.innerHTML = `
      <h3>Simulation Summary</h3>
      <p>Total Ticks: ${result.ticks}</p>
      <p>Outcome: ${result.outcome?.id || "None"}</p>
    `;
  }

  renderGlobalState(global) {
    const el = document.getElementById("ops-global");
    el.innerHTML = `
      <h3>Global State</h3>
      <pre>${JSON.stringify(global, null, 2)}</pre>
    `;
  }

  renderActors(actors) {
    const el = document.getElementById("ops-actors");
    el.innerHTML = `<h3>Actors</h3>`;
    for (const id in actors) {
      el.innerHTML += `
        <div style="margin-bottom:10px;">
          <strong>${id}</strong>
          <pre>${JSON.stringify(actors[id], null, 2)}</pre>
        </div>
      `;
    }
  }

  renderTimeline(logs) {
    const el = document.getElementById("ops-timeline");
    el.innerHTML = `<h3>Tick Timeline</h3>`;
    logs.forEach(log => {
      el.innerHTML += `<div>Tick ${log.tick}: ${log.message}</div>`;
    });
  }

  renderLogs(logs) {
    const el = document.getElementById("ops-logs");
    el.innerHTML = `<h3>Event Log</h3>`;
    logs.forEach(log => {
      el.innerHTML += `<div>[${log.tick}] ${log.message}</div>`;
    });
  }

  renderOutcome(outcome) {
    const el = document.getElementById("ops-outcome");
    el.innerHTML = `
      <h3>Outcome</h3>
      <pre>${JSON.stringify(outcome, null, 2)}</pre>
    `;
  }
}
