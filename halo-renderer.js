// halo-renderer.js
// HALO swarm renderer — canvas + agents + APEXCORE integration

const HALO_RENDERER = (() => {
  const MODULE_ID = "halo-renderer";

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  let agents = [];
  let lastUpdate = 0;

  // Simple agent model
  function createAgents(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
      });
    }
    return list;
  }

  function resizeCanvas() {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    width = rect.width || 640;
    height = rect.height || 360;

    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Reset transform and apply DPR scaling once
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function updateAgents(dt) {
    const speedScale = 1;
    for (const a of agents) {
      a.x += a.vx * dt * speedScale;
      a.y += a.vy * dt * speedScale;

      // Wrap around edges
      if (a.x < 0) a.x += 1;
      if (a.x > 1) a.x -= 1;
      if (a.y < 0) a.y += 1;
      if (a.y > 1) a.y -= 1;
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    const grd = ctx.createRadialGradient(
      width * 0.5,
      height * 0.4,
      0,
      width * 0.5,
      height * 0.4,
      Math.max(width, height) * 0.8
    );
    grd.addColorStop(0, "#0b1120");
    grd.addColorStop(1, "#020617");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
  }

  function drawAgents() {
    ctx.save();
    ctx.translate(width / 2, height / 2);

    const radius = Math.min(width, height) * 0.4;

    ctx.fillStyle = "rgba(96, 165, 250, 0.9)";
    ctx.strokeStyle = "rgba(37, 99, 235, 0.4)";
    ctx.lineWidth = 0.5;

    for (const a of agents) {
      const angle = a.x * Math.PI * 2;
      const r = radius * (0.3 + a.y * 0.7);

      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(px, py, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw(dt) {
    if (!ctx || width === 0 || height === 0) return;

    // IMPORTANT: reset transform each frame, then re-apply DPR scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    drawBackground();
    drawAgents();
  }

  // Main tick entry from ENGINE
  function tick(dtMs) {
    const dt = dtMs || 16;
    updateAgents(dt);
    draw(dt);

    lastUpdate = performance.now();

    if (window.APEXCORE && APEXCORE.api && APEXCORE.api.set) {
      APEXCORE.api.set("halo.agents", agents.length);
      APEXCORE.api.set("halo.formation", "swarm-ring");
      APEXCORE.api.set("halo.lastUpdate", lastUpdate.toFixed(0));
    }
  }

  function init(apexcore) {
    console.log("[HALO] init() starting…");

    canvas = document.getElementById("halo-canvas");
    if (!canvas) {
      console.warn("[HALO] No #halo-canvas found in DOM.");
      return;
    }

    ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("[HALO] 2D context not available.");
      return;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    agents = createAgents(120);
    lastUpdate = performance.now();

    if (apexcore && apexcore.api && apexcore.api.set) {
      apexcore.api.set("halo.agents", agents.length);
      apexcore.api.set("halo.formation", "swarm-ring");
      apexcore.api.set("halo.lastUpdate", lastUpdate.toFixed(0));
    }

    console.log("[HALO] init() complete — agents:", agents.length);
  }

  return {
    id: MODULE_ID,
    init,
    tick,
  };
})();

// Register with APEXCORE if available
if (window.APEXCORE && APEXCORE.register) {
  APEXCORE.register(HALO_RENDERER.id, HALO_RENDERER);
  console.log("[APEXCORE] Module registered: halo-renderer");
}
