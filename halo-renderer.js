// delete all + Paste all into halo-renderer.js

// HALO RENDERER v2.6 — Swarm sim + APEXCORE module integration

import { APEXCORE } from "./apexcore.js";

// Simple 2D swarm in normalized space [-1, 1] x [-1, 1]
const HALO_MODULE = {
  meta: {
    name: "halo-renderer",
    namespace: "halo",
    version: "2.6",
    description: "HALO Tactical HUD swarm renderer (Tier 1–2 baseline)",
    tags: ["sim", "renderer", "swarm", "halo"]
  },

  init(api, ctx) {
    const state = ctx.state;

    // Canvas hookup
    const canvas = document.getElementById("halo-canvas");
    if (!canvas) {
      console.warn("[HALO] #halo-canvas not found in DOM.");
      state.enabled = false;
      api.set("halo.status", "offline");
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      state.width = canvas.width;
      state.height = canvas.height;
    };

    state.canvas = canvas;
    state.ctx2d = canvas.getContext("2d");
    state.width = canvas.width;
    state.height = canvas.height;
    state.resize = resize;

    window.addEventListener("resize", resize);
    resize();

    // Swarm config
    state.agentCount = 120;
    state.agents = [];
    state.mode = "SWARM"; // baseline formation
    state.lastTick = 0;
    state.lastUpdate = null;

    // Seed agents
    for (let i = 0; i < state.agentCount; i++) {
      state.agents.push(makeAgent());
    }

    // Initial registry wiring for HUD
    api.set("halo.status", "online");
    api.set("halo.formation", "SWARM");
    api.set("halo.activity", "On");
    api.set("halo.integration", "On");
    api.set("halo.simspace", "Unbounded float");
    api.set("halo.agents", state.agentCount);
    api.set("halo.lastTick", 0);
    api.set("halo.lastUpdate", "—");

    console.log("[HALO] init() complete — agents:", state.agentCount);
  },

  tick(tickData, api, ctx) {
    const state = ctx.state;
    if (!state.enabled && state.enabled !== false) {
      // If init failed, bail
      return;
    }
    if (!state.canvas || !state.ctx2d) return;

    const { ctx2d, width, height, agents } = state;
    if (!width || !height || !agents || agents.length === 0) return;

    const dt = 0.016; // fixed step for now

    // Update swarm
    for (let i = 0; i < agents.length; i++) {
      stepAgent(agents[i], dt);
    }

    // Render
    ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    ctx2d.clearRect(0, 0, width, height);

    // Background glow
    const grd = ctx2d.createRadialGradient(
      width * 0.5,
      height * 0.5,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.6
    );
    grd.addColorStop(0, "rgba(123, 92, 255, 0.18)");
    grd.addColorStop(1, "rgba(5, 7, 11, 1.0)");
    ctx2d.fillStyle = grd;
    ctx2d.fillRect(0, 0, width, height);

    // Transform to normalized space [-1,1] -> canvas
    ctx2d.translate(width * 0.5, height * 0.5);
    const scale = Math.min(width, height) * 0.45;
    ctx2d.scale(scale, -scale);

    // Draw agents
    ctx2d.lineWidth = 0.004;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const alpha = 0.35 + 0.65 * a.energy;
      ctx2d.beginPath();
      ctx2d.fillStyle = `rgba(123, 92, 255, ${alpha})`;
      ctx2d.strokeStyle = `rgba(197, 189, 255, ${alpha * 0.8})`;
      const r = 0.012 + 0.008 * a.energy;
      ctx2d.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.stroke();
    }

    // Registry updates for HUD
    state.lastTick = tickData.count;
    state.lastUpdate = new Date().toLocaleTimeString();

    api.set("halo.lastTick", state.lastTick);
    api.set("halo.agents", state.agentCount);
    api.set("halo.lastUpdate", state.lastUpdate);
    api.set("halo.formation", state.mode);
    api.set("halo.activity", "On");
    api.set("halo.integration", "On");
    api.set("halo.simspace", "Unbounded float");

    // NOTE: Per-module perf metrics are handled by APEXCORE.runTick()
    // and exposed as modprofiler.halo-renderer.* in the registry.
  },

  destroy(api, ctx) {
    const state = ctx.state;
    if (state && state.resize) {
      window.removeEventListener("resize", state.resize);
    }
    api.set("halo.status", "offline");
    console.log("[HALO] destroy()");
  }
};

// --- Swarm helpers ---

function makeAgent() {
  // Position in unit circle
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 0.6;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  // Velocity with slight outward bias
  const speed = 0.1 + Math.random() * 0.25;
  const vx = Math.cos(angle + (Math.random() - 0.5) * 0.7) * speed;
  const vy = Math.sin(angle + (Math.random() - 0.5) * 0.7) * speed;

  return {
    x,
    y,
    vx,
    vy,
    energy: 0.4 + Math.random() * 0.6
  };
}

function stepAgent(a, dt) {
  // Mild center attraction
  const cx = 0;
  const cy = 0;
  const dx = cx - a.x;
  const dy = cy - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) + 1e-5;

  const attract = 0.25;
  a.vx += (dx / dist) * attract * dt;
  a.vy += (dy / dist) * attract * dt;

  // Soft damping
  const damping = 0.85;
  a.vx *= 1 - (1 - damping) * dt * 4;
  a.vy *= 1 - (1 - damping) * dt * 4;

  // Integrate
  a.x += a.vx * dt;
  a.y += a.vy * dt;

  // Energy flicker
  a.energy += (Math.random() - 0.5) * 0.15 * dt * 60;
  a.energy = Math.max(0.2, Math.min(1.0, a.energy));
}

// --- Module registration + mount ---

APEXCORE.register(HALO_MODULE);
APEXCORE.mount("halo-renderer");

// delete all + Paste all into halo-renderer.js
