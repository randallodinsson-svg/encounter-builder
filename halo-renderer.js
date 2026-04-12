// halo-renderer.js
// Corrected formation renderer — full pixel‑space math, no distortion, no flipping.

export const HALO_RENDERER = (() => {
  const MODULE_ID = "halo-renderer";

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  let agents = [];
  let lastUpdate = 0;

  const formations = ["ring", "disk", "lane"];
  let currentFormationIndex = 0;
  let lastFormationChange = 0;
  const formationIntervalMs = 10000; // 10 seconds

  // ------------------------------------------------------------
  // AGENTS
  // ------------------------------------------------------------
  function createAgents(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        px: 0,
        py: 0,
        targetPx: 0,
        targetPy: 0,
      });
    }
    return list;
  }

  // ------------------------------------------------------------
  // CANVAS RESIZE
  // ------------------------------------------------------------
  function resizeCanvas() {
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    width = rect.width || 640;
    height = rect.height || 360;

    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    console.log("[HALO] resizeCanvas()", width, height, "dpr:", dpr);

    // Recompute formation targets after resize
    updateFormationTargets(getCurrentFormation());
  }

  // ------------------------------------------------------------
  // FORMATIONS
  // ------------------------------------------------------------
  function getCurrentFormation() {
    return formations[currentFormationIndex] || "ring";
  }

  function updateFormationTargets(formation) {
    if (!agents.length || width === 0 || height === 0) return;

    const cx = width * 0.5;
    const cy = height * 0.5;
    const n = agents.length;
    const minDim = Math.min(width, height);

    for (let i = 0; i < n; i++) {
      const a = agents[i];

      if (formation === "ring") {
        const angle = (i / n) * Math.PI * 2;
        const r = minDim * 0.35;
        a.targetPx = cx + Math.cos(angle) * r;
        a.targetPy = cy + Math.sin(angle) * r;

      } else if (formation === "disk") {
        const angle = (i / n) * Math.PI * 2;
        const radiusFactor = 0.15 + 0.35 * (i / n);
        const r = minDim * radiusFactor;
        a.targetPx = cx + Math.cos(angle) * r;
        a.targetPy = cy + Math.sin(angle) * r;

      } else if (formation === "lane") {
        const t = i / (n - 1 || 1);
        const x0 = cx - minDim * 0.4;
        const x1 = cx + minDim * 0.4;
        a.targetPx = x0 + (x1 - x0) * t;
        a.targetPy = cy;

      } else {
        // fallback
        a.targetPx = cx;
        a.targetPy = cy;
      }

      // Snap initial positions
      if (a.px === 0 && a.py === 0) {
        a.px = a.targetPx;
        a.py = a.targetPy;
      }
    }
  }

  function maybeCycleFormation() {
    const now = performance.now();
    if (!lastFormationChange) {
      lastFormationChange = now;
      return;
    }
    if (now - lastFormationChange >= formationIntervalMs) {
      currentFormationIndex = (currentFormationIndex + 1) % formations.length;
      lastFormationChange = now;

      const f = getCurrentFormation();
      console.log("[HALO] formation changed →", f);
      updateFormationTargets(f);
    }
  }

  // ------------------------------------------------------------
  // UPDATE + DRAW
  // ------------------------------------------------------------
  function updateAgents(dt) {
    const lerp = 0.002 * dt;
    for (const a of agents) {
      a.px += (a.targetPx - a.px) * lerp;
      a.py += (a.targetPy - a.py) * lerp;

      // tiny noise for life
      a.px += (Math.random() - 0.5) * 0.1;
      a.py += (Math.random() - 0.5) * 0.1;
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
    ctx.fillStyle = "rgba(96, 165, 250, 0.9)";

    for (const a of agents) {
      ctx.beginPath();
      ctx.arc(a.px, a.py, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw(dt) {
    if (!ctx || width === 0 || height === 0) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    drawBackground();
    drawAgents();
  }

  // ------------------------------------------------------------
  // ENGINE TICK
  // ------------------------------------------------------------
  function tick(dtMs) {
    const dt = dtMs || 16;

    maybeCycleFormation();
    updateAgents(dt);
    draw(dt);

    lastUpdate = performance.now();
    const formation = getCurrentFormation();

    if (window.APEXCORE && APEXCORE.api && APEXCORE.api.set) {
      APEXCORE.api.set("halo.agents", agents.length);
      APEXCORE.api.set("halo.formation", formation);
      APEXCORE.api.set("halo.lastUpdate", lastUpdate.toFixed(0));
    }
  }

  // ------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------
  function init(apexcore) {
    console.log("[HALO] init() starting…");

    canvas = document.getElementById("halo-canvas");
    if (!canvas) return console.warn("[HALO] No #halo-canvas found.");

    ctx = canvas.getContext("2d");
    if (!ctx) return console.warn("[HALO] 2D context unavailable.");

    agents = createAgents(120);
    resizeCanvas();

    lastUpdate = performance.now();
    lastFormationChange = performance.now();
    updateFormationTargets(getCurrentFormation());

    if (apexcore && apexcore.api && apexcore.api.set) {
      apexcore.api.set("halo.agents", agents.length);
      apexcore.api.set("halo.formation", getCurrentFormation());
      apexcore.api.set("halo.lastUpdate", lastUpdate.toFixed(0));
    }

    window.addEventListener("resize", resizeCanvas);

    console.log("[HALO] init() complete — agents:", agents.length);
  }

  // ------------------------------------------------------------
  // UI HOOK
  // ------------------------------------------------------------
  function __forceResize() {
    resizeCanvas();
  }

  return {
    id: MODULE_ID,
    init,
    tick,
    __forceResize,
  };
})();

// Register with APEXCORE
if (window.APEXCORE && APEXCORE.register && APEXCORE.mount) {
  APEXCORE.register(HALO_RENDERER.id, HALO_RENDERER);
  APEXCORE.mount(HALO_RENDERER.id);
}
window.HALO_RENDERER = HALO_RENDERER;
