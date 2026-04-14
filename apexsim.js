/*
    APEXCORE v4.4 — APEXSIM Engine (Flow Field Edition)
*/

(function () {
  /* ----------------------------- */
  /*      SIMPLEX NOISE (2D)       */
  /* ----------------------------- */

  // Lightweight 2D Simplex Noise implementation (no external deps)
  function Simplex2D(seed = 1) {
    const grad3 = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Simple LCG for deterministic shuffle
    let s = seed >>> 0;
    function rand() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    }

    for (let i = 255; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0;
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      permMod12[i] = perm[i] % 12;
    }

    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    function noise2D(xin, yin) {
      let n0, n1, n2;

      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const X0 = i - t;
      const Y0 = j - t;
      const x0 = xin - X0;
      const y0 = yin - Y0;

      let i1, j1;
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } else {
        i1 = 0;
        j1 = 1;
      }

      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2;
      const y2 = y0 - 1 + 2 * G2;

      const ii = i & 255;
      const jj = j & 255;
      const gi0 = permMod12[ii + perm[jj]] % grad3.length;
      const gi1 = permMod12[ii + i1 + perm[jj + j1]] % grad3.length;
      const gi2 = permMod12[ii + 1 + perm[jj + 1]] % grad3.length;

      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 < 0) {
        n0 = 0;
      } else {
        t0 *= t0;
        const g = grad3[gi0];
        n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
      }

      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 < 0) {
        n1 = 0;
      } else {
        t1 *= t1;
        const g = grad3[gi1];
        n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
      }

      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 < 0) {
        n2 = 0;
      } else {
        t2 *= t2;
        const g = grad3[gi2];
        n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
      }

      // Scale to roughly [-1, 1]
      return 70 * (n0 + n1 + n2);
    }

    return { noise2D };
  }

  const noise = Simplex2D(1337);

  /* ----------------------------- */
  /*        APEXSIM ENGINE         */
  /* ----------------------------- */

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
      preset: "drift",
    },

    start() {
      console.log("APEXCORE v4.4 — APEXSIM online.");
      this._initParticles();
    },

    /* ----------------------------- */
    /*      INTERNAL INITIALIZER     */
    /* ----------------------------- */
    _initParticles() {
      const s = this._state;
      s.particles = [];
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (let i = 0; i < s.particleCount; i++) {
        s.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * s.particleSpeed,
          vy: (Math.random() - 0.5) * s.particleSpeed,
        });
      }
    },

    /* ----------------------------- */
    /*     RECOMMENDED UI API        */
    /* ----------------------------- */

    pause() {
      this._state.paused = true;
    },

    resume() {
      this._state.paused = false;
    },

    reset() {
      this.resetSimulation();
    },

    spawnBurst(count = 64) {
      const s = this._state;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      for (let i = 0; i < count; i++) {
        s.particles.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
        });
      }
    },

    setPreset(name) {
      this._state.preset = name;
      this.applyPreset(name);
    },

    setSpeed(v) {
      this.setParticleSpeed(v);
    },

    enableObstacles(v) {
      this.setObstaclesEnabled(v);
    },

    enableTrails(v) {
      this.setTrailsEnabled(v);
    },

    /* ----------------------------- */
    /*   ORIGINAL ENGINE FUNCTIONS   */
    /* ----------------------------- */

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

    resetSimulation() {
      this._initParticles();
    },

    applyPreset(preset) {
      const s = this._state;
      switch (preset) {
        case "swarm":
          s.fieldStrength = 1.8;
          s.particleSpeed = 1.0;
          break;
        case "drift":
          s.fieldStrength = 0.7;
          s.particleSpeed = 0.6;
          break;
        case "pulse":
          s.fieldStrength = 2.4;
          s.particleSpeed = 1.6;
          break;
        case "orbit":
          s.fieldStrength = 1.2;
          s.particleSpeed = 2.0;
          break;
      }
    },

    /* ----------------------------- */
    /*   FLOW FIELD ACCESSOR         */
    /* ----------------------------- */

    // Returns a direction vector from the flow field at (x, y)
    sampleFlow(x, y) {
      const s = this._state;
      const scale = 0.0015; // spatial scale of the field
      const t = performance.now() * 0.00015; // temporal evolution

      const nx = x * scale;
      const ny = y * scale;

      // Two noise samples, phase‑shifted, to form a 2D vector
      const angle =
        noise.noise2D(nx + t, ny) * Math.PI * 2 * 0.25 +
        noise.noise2D(nx, ny + t) * Math.PI * 2 * 0.25;

      const fx = Math.cos(angle);
      const fy = Math.sin(angle);

      // Scale by field strength
      const strength = s.fieldStrength;
      return { fx: fx * strength, fy: fy * strength };
    },
  };

  window.APEXSIM = APEXSIM;
  APEX.register("apexsim", APEXSIM);
})();
