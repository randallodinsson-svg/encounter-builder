// phase35-coalition-visualizer.js
// APEXCORE v4.4 — Phase 35: Coalition Visualization Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalViz = (APEX.CoalViz = APEX.CoalViz || {});

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;

  CoalViz.config = {
    haloColor: "rgba(120, 180, 255, 0.18)",
    lineColor: "rgba(120, 180, 255, 0.45)",
    labelColor: "rgba(255,255,255,0.8)",
    haloSize: 55,
    lineWidth: 1.4
  };

  function ensureCanvas() {
    if (!canvas) {
      canvas = document.getElementById("coalCanvas");
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

  function drawHalo(x, y, strength, cfg) {
    const radius = cfg.haloSize * (0.6 + strength);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = cfg.haloColor.replace(/0\.\d+\)/, (0.1 + strength * 0.4).toFixed(2) + ")");
    ctx.fill();
  }

  function drawLink(a, b, strength, cfg) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = cfg.lineColor.replace(/0\.\d+\)/, (0.2 + strength * 0.5).toFixed(2) + ")");
    ctx.lineWidth = cfg.lineWidth * (0.8 + strength);
    ctx.stroke();
  }

  function drawLabel(x, y, text, cfg) {
    ctx.fillStyle = cfg.labelColor;
    ctx.font = "11px system-ui";
    ctx.fillText(text, x + 6, y - 6);
  }

  CoalViz.updateCoalitionVisualization = function (formations, dt) {
    ensureCanvas();
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, width, height);

    if (!APEX.Coalitions || !APEX.Coalitions.state) return;

    const cfg = CoalViz.config;
    const coalitions = APEX.Coalitions.state.coalitions;

    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      const members = c.members.map(id => formations.find(f => f.id === id)).filter(Boolean);
      if (members.length === 0) continue;

      const strength = c.strength || 0.3;

      for (let j = 0; j < members.length; j++) {
        const f = members[j];
        const p = project(f.x, f.y);

        drawHalo(p.x, p.y, strength, cfg);

        for (let k = j + 1; k < members.length; k++) {
          const f2 = members[k];
          const p2 = project(f2.x, f2.y);
          drawLink(p, p2, strength, cfg);
        }

        drawLabel(p.x, p.y, c.id, cfg);
      }
    }
  };

  console.log("PHASE35_COALVIZ — online (Coalition Visualization Layer).");
})(this);
