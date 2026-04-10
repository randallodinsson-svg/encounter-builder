// apexops.js
// APEXOPS v2 — Interactive Runtime Inspector for APEXSIM

export class ApexOps {
  constructor(rootElementId, simFactory = null) {
    this.root = document.getElementById(rootElementId);
    if (!this.root) {
      console.error(`APEXOPS: Root element #${rootElementId} not found.`);
      return;
    }

    this.simFactory = simFactory; // () => new ApexSim(scenario)
    this.currentResult = null;

    this.root.innerHTML = `
      <div id="apexops-container" style="font-family: monospace; padding: 20px; color: #eee; background:#111; min-height:100vh;">
        <h2>APEXOPS Runtime Inspector v2</h2>

        <div id="ops-controls" style="margin-bottom:20px;">
          <button id="ops-run-btn" style="margin-right:10px;">Run Simulation</button>
          <button id="ops-clear-btn">Clear</button>
        </div>

        <div id="ops-summary" style="margin-bottom:20px;"></div>
        <div id="ops-global" style="margin-bottom:20px;"></div>
        <div id="ops-actors" style="margin-bottom:20px;"></div>
        <div id="ops-timeline" style="margin-bottom:20px;"></div>
        <div id="ops-logs" style="margin-bottom:20px;"></div>
        <div id="ops-outcome" style="margin-bottom:20px; font-weight:bold;"></div>
      </div>
    `;

    this._wireControls();
  }

  _wireControls() {
    const runBtn = document.getElementById("ops-run-btn");
    const clearBtn = document.getElementById("ops-clear-btn");

    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (!this.simFactory) {
          console.error("APEXOPS: No simFactory provided. Cannot run simulation.");
          return;
        }
        const sim = this.simFactory();
        const result = sim.start();
        this.loadSimulationResult(result);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearView();
      });
    }
  }

  clearView() {
    this.currentResult = null;
    const ids = ["ops-summary", "ops-global", "ops-actors", "ops-timeline", "ops-logs", "ops-outcome"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }

  loadSimulationResult(result) {
    if (!result) {
      console.error("APEXOPS: No simulation result provided.");
      return;
    }

    this.currentResult = result;
    this.renderSummary(result);
    this.renderGlobalState(result.finalState.global);
    this.renderActors(result.finalState.actors);
    this.renderTimeline(result.logs);
    this.renderLogs(result.logs);
    this.renderOutcome(result.outcome);
  }

  renderSummary(result) {
    const el = document.getElementById("ops-summary");
    if (!el) return;
    el.innerHTML = `
      <h3>Simulation Summary</h3>
      <p>Total Ticks: ${result.ticks}</p>
      <p>Outcome: ${result.outcome?.id || "None"}</p>
    `;
  }

  renderGlobalState(global) {
    const el = document.getElementById("ops-global");
    if (!el) return;
    el.innerHTML = `
      <h3>Global State</h3>
      <pre>${JSON.stringify(global, null, 2)}</pre>
    `;
  }

  renderActors(actors) {
    const el = document.getElementById("ops-actors");
    if (!el) return;
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
    if (!el) return;
    el.innerHTML = `<h3>Tick Timeline</h3>`;
    logs.forEach(log => {
      el.innerHTML += `<div>Tick ${log.tick}: ${log.message}</div>`;
    });
  }

  renderLogs(logs) {
    const el = document.getElementById("ops-logs");
    if (!el) return;
    el.innerHTML = `<h3>Event Log</h3>`;
    logs.forEach(log => {
      el.innerHTML += `<div>[${log.tick}] ${log.message}</div>`;
    });
  }

  renderOutcome(outcome) {
    const el = document.getElementById("ops-outcome");
    if (!el) return;
    el.innerHTML = `
      <h3>Outcome</h3>
      <pre>${JSON.stringify(outcome, null, 2)}</pre>
    `;
  }
}
