// FILE: apex-ui.js
// APEX UI v4.4 — NUKE Rebuild (Minimal Control Layer)

(function () {
  const UI = {
    start() {
      console.log("APEX UI — online.");

      this._bind();
    },

    update(dt) {
      // UI is event-driven; no per-frame logic needed.
    },

    _bind() {
      const ops = APEX.getModule("apexops");
      const sim = APEX.getModule("apexsim");

      // Example: bind keyboard shortcuts
      window.addEventListener("keydown", (e) => {
        if (e.key === "r") {
          ops.resetSim();
        }
        if (e.key === "b") {
          ops.burst(64);
        }
      });

      // Example: simple UI buttons (if present)
      const resetBtn = document.querySelector("[data-ui='reset']");
      const burstBtn = document.querySelector("[data-ui='burst']");

      if (resetBtn) resetBtn.onclick = () => ops.resetSim();
      if (burstBtn) burstBtn.onclick = () => ops.burst(64);
    },
  };

  APEX.register("ui", UI);
})();
