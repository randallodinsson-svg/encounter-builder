/* ========================================================================
   APEXOPS v3 — RUNTIME INSPECTOR MODULE
   ------------------------------------------------------------------------
   Author: Randy Sellhausen (APEXCORE Platform)
   Module: APEXOPS — Runtime Inspector
   Version: 3.0.0
   Identity: Industrial, world‑agnostic, platform‑neutral
   Purpose: Provide structured inspection, visualization, and analysis
            of simulation results produced by APEXCORE + APEXSIM.
   ======================================================================== */

export class ApexOps {
  constructor(rootElementId, simFactory) {
    this.rootId = rootElementId;
    this.simFactory = simFactory;

    this.root = null;
    this.currentResult = null;

    this._mount();
  }

  /* ========================================================================
     MOUNT PANEL
     ======================================================================== */
  _mount() {
    this.root = document.getElementById(this.rootId);
    if (!this.root) {
      console.warn(`APEXOPS: Root element '${this.rootId}' not found.`);
      return;
    }

    this.root.innerHTML = `
      <div style="font-size:12px; color:#ccc;">
        <div style="margin-bottom:8px;">APEXOPS Runtime Inspector Ready.</div>
        <div id="ops-live-view" style="white-space:pre; font-size:11px; color:#aaa;">
          No simulation loaded.
        </div>
      </div>
    `;
  }

  /* ========================================================================
     LOAD SIMULATION RESULT
     ======================================================================== */
  loadSimulationResult(result) {
    this.currentResult = result;

    const view = this.root.querySelector("#ops-live-view");
    if (!view) return;

    try {
      view.textContent = JSON.stringify(result, null, 2);
    } catch {
      view.textContent = String(result);
    }
  }

  /* ========================================================================
     RUN SIMULATION (INTERNAL)
     ------------------------------------------------------------------------
     Used by APEXOPS UI or external callers.
     ======================================================================== */
  runSimulation(core) {
    if (!this.simFactory) {
      throw new Error("APEXOPS: No simFactory provided.");
    }

    const result = core.startSimulation(s => this.simFactory(s));
    this.loadSimulationResult(result);
    return result;
  }

  /* ========================================================================
     RESET VIEW
     ======================================================================== */
  reset() {
    this.currentResult = null;

    const view = this.root.querySelector("#ops-live-view");
    if (view) {
      view.textContent = "No simulation loaded.";
    }
  }
}

/* ========================================================================
   FACTORY — Create a fully configured APEXOPS instance
   ======================================================================== */
export function createApexOps(rootId, simFactory) {
  return new ApexOps(rootId, simFactory);
}
