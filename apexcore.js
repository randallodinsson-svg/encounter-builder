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
      if (window.APEX && typeof APEX.startAll === "function") {
        APEX.startAll();
      }
      console.log("APEXCORE v4.4 — Boot sequence complete.");
    },
  };

  APEX.register("apexcore", ApexCore);

  // Auto‑start once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => ApexCore.start());
  } else {
    ApexCore.start();
  }
})();
