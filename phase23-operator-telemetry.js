// phase23-operator-telemetry.js
// APEXCORE v4.4 — Phase 23: Operator Telemetry Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Telemetry = (APEX.Telemetry = APEX.Telemetry || {});

  Telemetry.config = {
    evalInterval: 0.5
  };

  Telemetry.lastSnapshot = {
    time: 0,
    formations: 0,
    avgPressure: 0,
    avgIntegrity: 0,
    avgTension: 0,
    avgSalience: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  };

  function accumulate(formations) {
    let pressureSum = 0;
    let integritySum = 0;
    let tensionSum = 0;
    let salienceSum = 0;
    let count = formations.length;

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (let i = 0; i < formations.length; i++) {
      const f = formations[i];
      const mem = f.memory || {};

      const p = mem.lastPressure != null ? mem.lastPressure : 0.5;
      const integrity = f.integrity != null ? f.integrity : 1.0;
      const tension = mem.lastNarrativeTension != null ? mem.lastNarrativeTension : 0.5;
      const sal = f.salience != null ? f.salience : 0.0;
      const tier = f.salienceTier || "LOW";

      pressureSum += p;
      integritySum += integrity;
      tensionSum += tension;
      salienceSum += sal;

      switch (tier) {
        case "CRITICAL": critical++; break;
        case "HIGH":     high++; break;
        case "MEDIUM":   medium++; break;
        default:         low++; break;
      }
    }

    if (!count) count = 1;

    return {
      formations: formations.length,
      avgPressure: pressureSum / count,
      avgIntegrity: integritySum / count,
      avgTension: tensionSum / count,
      avgSalience: salienceSum / count,
      criticalCount: critical,
      highCount: high,
      mediumCount: medium,
      lowCount: low
    };
  }

  Telemetry.updateGlobalTelemetry = (function () {
    let time = 0;
    let lastEval = 0;

    return function (formations, dt) {
      time += dt;
      const cfg = Telemetry.config;

      if (time - lastEval < cfg.evalInterval) return;
      lastEval = time;

      const snapshot = accumulate(formations || []);
      snapshot.time = time;

      Telemetry.lastSnapshot = snapshot;
      // Kept silent for now; UI or debug overlays can read Telemetry.lastSnapshot.
    };
  })();

  console.log("PHASE23_TELEMETRY — online (Operator Telemetry Layer).");
})(this);
