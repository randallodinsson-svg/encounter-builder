// phase26-atmosphere-mood.js
// APEXCORE v4.4 — Phase 26: Atmosphere & Mood Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Atmos = (APEX.Atmos = APEX.Atmos || {});

  Atmos.config = {
    refreshInterval: 0.2,
    minTension: 0.0,
    maxTension: 1.0
  };

  let overlayEl = null;

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    const root = document.getElementById("overlay-root");
    if (!root) return null;

    overlayEl = document.createElement("div");
    overlayEl.className = "mood-overlay";
    root.appendChild(overlayEl);
    return overlayEl;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function tensionToColors(tension) {
    // 0.0 → calm blue, 0.5 → teal, 1.0 → hot magenta/red
    const t = clamp01(tension);

    const cold = { r: 0, g: 160, b: 255 };
    const mid  = { r: 0, g: 220, b: 180 };
    const hot  = { r: 255, g: 60, b: 140 };

    let c1, c2;
    if (t < 0.5) {
      const k = t / 0.5;
      c1 = {
        r: lerp(cold.r, mid.r, k),
        g: lerp(cold.g, mid.g, k),
        b: lerp(cold.b, mid.b, k)
      };
      c2 = cold;
    } else {
      const k = (t - 0.5) / 0.5;
      c1 = {
        r: lerp(mid.r, hot.r, k),
        g: lerp(mid.g, hot.g, k),
        b: lerp(mid.b, hot.b, k)
      };
      c2 = mid;
    }

    return {
      inner: `rgba(${c1.r | 0}, ${c1.g | 0}, ${c1.b | 0}, 0.55)`,
      outer: `rgba(${c2.r | 0}, ${c2.g | 0}, ${c2.b | 0}, 0.0)`
    };
  }

  Atmos.start = function () {
    ensureOverlay();
    if (!overlayEl) return;

    let lastTime = 0;

    function loop() {
      requestAnimationFrame(loop);

      if (!APEX.Telemetry || !APEX.Telemetry.lastSnapshot) return;
      const snap = APEX.Telemetry.lastSnapshot;
      const now = snap.time || 0;

      if (now - lastTime < Atmos.config.refreshInterval) return;
      lastTime = now;

      const tension = snap.avgTension != null ? snap.avgTension : 0.5;
      const tNorm = clamp01(
        (tension - Atmos.config.minTension) /
        (Atmos.config.maxTension - Atmos.config.minTension || 1)
      );

      const colors = tensionToColors(tNorm);
      const intensity = 0.15 + tNorm * 0.45; // 0.15 → 0.60

      overlayEl.style.opacity = intensity.toFixed(2);
      overlayEl.style.background =
        `radial-gradient(circle at 50% 50%, ${colors.inner}, ${colors.outer} 65%)`;
    }

    loop();
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(() => Atmos.start(), 0);
  } else {
    window.addEventListener("DOMContentLoaded", () => Atmos.start());
  }

  console.log("PHASE26_ATMOS — online (Atmosphere & Mood Layer).");
})(this);
