// HALO Tactical HUD — Simulation + Renderer
// v2.5 — Unbounded float simulation space, 150 agents

// CONFIG
const HALO_CONFIG = {
  agentCount: 150,
  maxSpeed: 0.12,
  neighborRadius: 2.5,
  separationRadius: 0.8,
  cohesionFactor: 0.0025,
  alignmentFactor: 0.04,
  separationFactor: 0.06,
  jitterFactor: 0.02,
  drag: 0.98,
};

// INTERNAL STATE
let agents = [];
let tickCounter = 0;
let lastUpdate = null;
let lastMs = 0;
let minMs = Infinity;
let maxMs = 0;
let totalMs = 0;
let ticks = 0;

// Canvas + rendering state
let canvas = null;
let ctx = null;
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;

// Simple seeded RNG for stable-ish behavior
let rngSeed = 1337;
function rand() {
  rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0;
  return rngSeed / 0xffffffff;
}

// Initialize agents in a small cluster around origin
function initAgents() {
  agents = [];
  for (let i = 0; i < HALO_CONFIG.agentCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 3 + rand() * 3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const vx = (rand() - 0.5) * 0.05;
    const vy = (rand() - 0.5) * 0.05;
    agents.push({ x, y, vx, vy });
  }
}

// Boids-lite update
function updateAgents(deltaMs) {
  const dt = deltaMs || 16.67;
  const dtScale = dt / 16.67;

  const {
    neighborRadius,
    separationRadius,
    cohesionFactor,
    alignmentFactor,
    separationFactor,
    jitterFactor,
    drag,
    maxSpeed,
  } = HALO_CONFIG;

  const neighborRadiusSq = neighborRadius * neighborRadius;
  const separationRadiusSq = separationRadius * separationRadius;

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];

    let count = 0;
    let avgX = 0;
    let avgY = 0;
    let avgVx = 0;
    let avgVy = 0;
    let sepX = 0;
    let sepY = 0;

    for (let j = 0; j < agents.length; j++) {
      if (i === j) continue;
      const b = agents[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < neighborRadiusSq) {
        count++;
        avgX += b.x;
        avgY += b.y;
        avgVx += b.vx;
        avgVy += b.vy;

        if (distSq < separationRadiusSq && distSq > 0.0001) {
          const inv = 1 / distSq;
          sepX -= dx * inv;
          sepY -= dy * inv;
        }
      }
    }

    if (count > 0) {
      const invCount = 1 / count;

      // Cohesion: move toward center of neighbors
      const centerX = avgX * invCount;
      const centerY = avgY * invCount;
      a.vx += (centerX - a.x) * cohesionFactor * dtScale;
      a.vy += (centerY - a.y) * cohesionFactor * dtScale;

      // Alignment: match average velocity
      const alignVx = avgVx * invCount;
      const alignVy = avgVy * invCount;
      a.vx += (alignVx - a.vx) * alignmentFactor * dtScale;
      a.vy += (alignVy - a.vy) * alignmentFactor * dtScale;

      // Separation: avoid crowding
      a.vx += sepX * separationFactor * dtScale;
      a.vy += sepY * separationFactor * dtScale;
    }

    // Jitter
    a.vx += (rand() - 0.5) * jitterFactor * dtScale;
    a.vy += (rand() - 0.5) * jitterFactor * dtScale;

    // Drag
    a.vx *= Math.pow(drag, dtScale);
    a.vy *= Math.pow(drag, dtScale);

    // Clamp speed
    const speedSq = a.vx * a.vx + a.vy * a.vy;
    const maxSpeedSq = maxSpeed * maxSpeed;
    if (speedSq > maxSpeedSq) {
      const s = maxSpeed / Math.sqrt(speedSq);
      a.vx *= s;
      a.vy *= s;
    }

    // Integrate position (unbounded float space)
    a.x += a.vx * dtScale;
    a.y += a.vy * dtScale;
  }
}

// Canvas helpers
function ensureCanvas() {
  if (!canvas) {
    canvas = document.getElementById("halo-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
  }
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  if (width !== lastCanvasWidth || height !== lastCanvasHeight) {
    lastCanvasWidth = width;
    lastCanvasHeight = height;
    canvas.width = width;
    canvas.height = height;
  }
}

function renderAgentsToCanvas() {
  if (!canvas || !ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return;

  ctx.clearRect(0, 0, width, height);

  // Compute bounds in sim space for auto-fit
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const a of agents) {
    if (a.x < minX) minX = a.x;
    if (a.x > maxX) maxX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.y > maxY) maxY = a.y;
  }

  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return;
  }

  const padding = 0.4;
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  const scaleX = (width * (1 - padding)) / spanX;
  const scaleY = (height * (1 - padding)) / spanY;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = width * 0.5 - ((minX + maxX) * 0.5) * scale;
  const offsetY = height * 0.5 - ((minY + maxY) * 0.5) * scale;

  // Background glow
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    0,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.6
  );
  gradient.addColorStop(0, "rgba(123, 92, 255, 0.18)");
  gradient.addColorStop(1, "rgba(5, 7, 11, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw agents
  ctx.lineWidth = 1;
  for (const a of agents) {
    const sx = a.x * scale + offsetX;
    const sy = a.y * scale + offsetY;

    const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy) || 0.0001;
    const dirX = a.vx / speed;
    const dirY = a.vy / speed;

    const len = 7;
    const tailLen = 4;

    const hx = sx + dirX * len;
    const hy = sy + dirY * len;
    const tx = sx - dirX * tailLen;
    const ty = sy - dirY * tailLen;

    // Tail
    ctx.strokeStyle = "rgba(63, 213, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Head
    ctx.strokeStyle = "rgba(197, 189, 255, 0.9)";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Core dot
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// PUBLIC MODULE API
export const meta = {
  name: "HALO Tactical HUD Renderer",
  namespace: "halo.renderer",
  capabilities: ["sim", "render", "halo"],
};

export const hooks = {
  tick: true,
  mount: true,
  unmount: true,
};

export function mount(registry) {
  initAgents();
  ensureCanvas();

  registry["halo.status"] = "online";
  registry["halo.agentCount"] = agents.length;
  registry["halo.lastTick"] = 0;
  registry["halo.lastUpdate"] = new Date().toISOString();

  registry["modprofiler.halo-renderer.lastMs"] = 0;
  registry["modprofiler.halo-renderer.minMs"] = 0;
  registry["modprofiler.halo-renderer.maxMs"] = 0;
  registry["modprofiler.halo-renderer.avgMs"] = 0;
  registry["modprofiler.halo-renderer.ticks"] = 0;
}

export function unmount(registry) {
  registry["halo.status"] = "offline";
}

export function tick(registry, deltaMs) {
  const start = performance.now();

  if (!agents || agents.length === 0) {
    initAgents();
  }

  ensureCanvas();
  updateAgents(deltaMs);
  renderAgentsToCanvas();

  tickCounter++;
  lastUpdate = new Date().toISOString();

  // Write HALO registry data
  registry["halo.status"] = "online";
  registry["halo.lastTick"] = tickCounter;
  registry["halo.lastUpdate"] = lastUpdate;
  registry["halo.agentCount"] = agents.length;
  registry["halo.agents"] = agents;

  // Profiling
  const end = performance.now();
  const elapsed = end - start;
  lastMs = elapsed;
  ticks++;
  totalMs += elapsed;
  if (elapsed < minMs) minMs = elapsed;
  if (elapsed > maxMs) maxMs = elapsed;

  registry["modprofiler.halo-renderer.lastMs"] = lastMs;
  registry["modprofiler.halo-renderer.minMs"] = isFinite(minMs) ? minMs : lastMs;
  registry["modprofiler.halo-renderer.maxMs"] = maxMs;
  registry["modprofiler.halo-renderer.avgMs"] = totalMs / ticks;
  registry["modprofiler.halo-renderer.ticks"] = ticks;
}
