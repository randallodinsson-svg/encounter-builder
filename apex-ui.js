// FILE: apex-ui.js
// APEX UI v4.4 — Phase 4 (Preset Controls)

(function () {
  const UI = {
    start() {
      console.log("APEX UI — online.");
      this._bind();
    },

    update(dt) {},

    _bind() {
      const ops = APEX.getModule("apexops");
      const controller = APEX.getModule("field-controller");

      // Reset + Burst
      const resetBtn = document.querySelector("[data-ui='reset']");
      const burstBtn = document.querySelector("[data-ui='burst']");

      if (resetBtn) resetBtn.onclick = () => ops.resetSim();
      if (burstBtn) burstBtn.onclick = () => ops.burst(64);

      // Preset buttons
      const presets = [
        "calm",
        "drift",
        "swirl",
        "storm",
        "collapse",
        "pulse",
      ];

      presets.forEach((p) => {
        const btn = document.querySelector(`[data-ui='preset-${p}']`);
        if (btn) {
          btn.onclick = () =>
            controller.applyPreset(
              p.charAt(0).toUpperCase() + p.slice(1)
            );
        }
      });
    },
  };

  APEX.register("ui", UI);
})();
