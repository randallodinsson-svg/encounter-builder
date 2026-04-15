// phase31-relationship-visualizer.js
// APEXCORE v4.4 — Phase 31: Relationship Visualization Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const RelViz = (APEX.RelViz = APEX.RelViz || {});

  RelViz.config = {
    minMagnitude: 0.15,
    maxLinesPerFormation: 6,
    lineWidth: 1.0,
    trustColor: "rgba(80, 200, 255, 0.45)",
    threatColor: "rgba(255, 80, 120, 0.55)"
  };

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;

  function ensureCanvas() {
    if (!canvas) {
      canvas = document.getElementById("diagCanvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      resize();
      window.addEventListener("resize", resize);
    }
  }

  function resize() {
    if (!canvas) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function project(x, y) {
    return { x, y };
  }

  function drawLine(ax, ay, bx, by, value, cfg) {
    if (!ctx) return;

    const mag = Math.abs(value);
    if (mag < cfg.minMagnitude) return;

    const color = value >= 0 ? cfg.trustColor : cfg.threatColor;
    const alphaScale = Math.min(1, mag * 1.5);

    ctx.strokeStyle = color.replace(/0\.\d+\)/, alphaScale.toFixed(2) + ")");
    ctx.lineWidth = cfg.lineWidth * (0.5 + mag);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  RelViz.updateVisualization = function (formations, dt) {
    ensureCanvas();
    if (!ctx || !canvas) return;
    if (!formations || formations.length === 0) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const cfg = RelViz.config;
    ctx.clearRect(0, 0, width, height);

    const byId = {};
    for (let i = 0; i < formations.length; i++) {
      byId[formations[i].id] = formations[i];
    }

    for (let i = 0; i < formations.length; i++) {
      const a = formations[i];
      if (!a.relationships) continue;

      const rel = a.relationships;
      const keys = Object.keys(rel);
      if (!keys.length) continue;

      keys.sort((k1, k2) => Math.abs(rel[k2]) - Math.abs(rel[k1]));
      const limited = keys.slice(0, cfg.maxLinesPerFormation);

      const pa = project(a.x, a.y);

      for (let j = 0; j < limited.length; j++) {
        const id = limited[j];
        const value = rel[id];
        const b = byId[id];
        if (!b) continue;

        const pb = project(b.x, b.y);
        drawLine(pa.x, pa.y, pb.x, pb.y, value, cfg);
      }
    }
  };

  console.log("PHASE31_RELVIZ — online (Relationship Visualization Layer).");
})(this);
