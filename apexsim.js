// ------------------------------------------------------------
// APEXCORE v4.4 — APEXSIM ENGINE
// ------------------------------------------------------------

window.APEXSIM = (function () {
  const api = {};

  // -----------------------------
  // INTERNAL STATE
  // -----------------------------
  const state = {
    fps: 0,
    delta: 0,
    particleCount: 512,
    particleSpeed: 1.0,
    fieldStrength: 1.0,
    obstaclesEnabled: true,
    trailsEnabled: true,
    paused: false,
    particles: [],
    obstacles: []
  };

  api._state = state;

  // -----------------------------
  // PARTICLE SYSTEM
  // -----------------------------
  function initParticles() {
    state.particles = [];
    for (let i = 0; i < state.particleCount; i++) {
      state.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * state.particleSpeed,
        vy: (Math.random() - 0.5) * state.particleSpeed
      });
    }
  }

  initParticles();

  // -----------------------------
  // CONTROL SURFACE API
  // -----------------------------
  api.setParticleCount = function (count) {
    state.particleCount = count;
    initParticles();
  };

  api.setParticleSpeed = function (speed) {
    state.particleSpeed = speed;
  };

  api.setFieldStrength = function (strength) {
    state.fieldStrength = strength;
  };

  api.setObstaclesEnabled = function (enabled) {
    state.obstaclesEnabled = enabled;
  };

  api.setTrailsEnabled = function (enabled) {
    state.trailsEnabled = enabled;
  };

  api.setPaused = function (paused) {
    state.paused = paused;
  };

  api.spawnBurst = function () {
    for (let i = 0; i < 50; i++) {
      state.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4
      });
    }
  };

  api.resetSimulation = function () {
    initParticles();
  };

  api.applyPreset = function (preset) {
    switch (preset) {
      case "swarm":
        state.fieldStrength = 1.5;
        state.particleSpeed = 1.0;
        break;
      case "drift":
        state.fieldStrength = 0.5;
        state.particleSpeed = 0.5;
        break;
      case "pulse":
        state.fieldStrength = 2.0;
        state.particleSpeed = 1.5;
        break;
      case "orbit":
        state.fieldStrength = 1.0;
        state.particleSpeed = 2.0;
        break;
    }
  };

  return api;
})();
