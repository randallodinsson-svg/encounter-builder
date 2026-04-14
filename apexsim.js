/*
    APEXCORE v4.4 — APEXSIM Engine
*/

(function () {
  const APEXSIM = {
    _state: {
      fps: 0,
      delta: 0,
      particleCount: 512,
      particleSpeed: 1.0,
      fieldStrength: 1.0,
      obstaclesEnabled: true,
      trailsEnabled: true,
      paused: false,
      particles: [],
    },

    start() {
      console.log("APEXCORE v4.4 — APEXSIM online.");
      this._initParticles();
    },

    _initParticles() {
      const s = this._state;
      s.particles = [];
      for (let i = 0; i < s.particleCount; i++) {
        s.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * s.particleSpeed,
          vy: (Math.random() - 0.5) * s.particleSpeed,
        });
      }
    },

    // Control surface
    setParticleCount(count) {
      this._state.particleCount = count;
      this._initParticles();
    },

    setParticleSpeed(speed) {
      this._state.particleSpeed = speed;
    },

    setFieldStrength(strength) {
      this._state.fieldStrength = strength;
    },

    setObstaclesEnabled(enabled) {
      this._state.obstaclesEnabled = enabled;
    },

    setTrailsEnabled(enabled) {
      this._state.trailsEnabled = enabled;
    },

    setPaused(paused) {
      this._state.paused = paused;
    },

    spawnBurst() {
      const s = this._state;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      for (let i = 0; i < 64; i++) {
        s.particles.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
        });
      }
    },

    resetSimulation() {
      this._initParticles();
    },

    applyPreset(preset) {
      const s = this._state;
      switch (preset) {
        case "swarm":
          s.fieldStrength = 1.5;
          s.particleSpeed = 1.0;
          break;
        case "drift":
          s.fieldStrength = 0.5;
          s.particleSpeed = 0.5;
          break;
        case "pulse":
          s.fieldStrength = 2.0;
          s.particleSpeed = 1.5;
          break;
        case "orbit":
          s.fieldStrength = 1.0;
          s.particleSpeed = 2.0;
          break;
      }
    },
  };

  window.APEXSIM = APEXSIM;
  APEX.register("apexsim", APEXSIM);
})();
