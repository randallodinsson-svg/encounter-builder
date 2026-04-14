/*
    APEXCORE v4.4 — Engine Shim
    Bridges the APEX module registry (core.js)
    with a proper APEX.start() entrypoint.
*/

(function () {
  // Ensure global APEX exists
  if (!window.APEX) {
    window.APEX = {};
  }

  const APEX = window.APEX;

  // Safety: don't overwrite if a proper start already exists
  if (typeof APEX.start === "function") {
    return;
  }

  // A simple engine entrypoint that delegates to core.js's startAll()
  APEX.start = function () {
    console.log("APEXCORE v4.4 — Starting all modules...");

    if (typeof APEX.startAll === "function") {
      APEX.startAll();
    } else {
      console.warn("APEXCORE v4.4 — Warning: APEX.startAll() is not defined.");
    }

    console.log("APEXCORE v4.4 — All modules started.");
  };
})();
