// FILE: apexcore.js
/*
    APEXCORE v4.4 — Platform Shell
*/

(function () {
  const ApexCore = {
    version: "4.4",
    build: "SIM-LAYER",
    started: false,

    start() {
      if (this.started) return;
      this.started = true;

      console.log("APEXCORE v4.4 — Boot sequence starting...");

      // Hand off to the unified engine start function
      if (window.APEX && typeof APEX.start === "function") {
        APEX.start();
      } else {
        console.warn("APEXCORE: APEX.start() not found.");
      }

      console.log("APEXCORE v4.4 — Boot sequence complete.");
    },
  };

  // Register this module with the core registry
  if (window.APEX && typeof APEX.register === "function") {
    APEX.register("apexcore", ApexCore);
  } else {
    console.warn("APEXCORE: APEX.register() not found.");
  }

  // Auto‑start once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => ApexCore.start());
  } else {
    ApexCore.start();
  }
})();
