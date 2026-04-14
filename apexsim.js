/*
    APEXCORE v4.6 — APEXSIM Engine
    Simplex Flow Field + Fractal Curl Noise (3 Layers, Different Speeds) + Resume Kick
*/

(function () {

  /* ----------------------------- */
  /*      SIMPLEX NOISE (2D)       */
  /* ----------------------------- */

  function Simplex2D(seed = 1) {
    const grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

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
      if (x0 > y0) { i1 = 1; j1 = 0; }
      else { i1 = 0; j1 = 1; }

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
      if (t0 < 0) n0 = 0;
      else {
        t0 *= t0;
        const g = grad3[gi0];
        n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
      }

      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 < 0) n1 = 0;
      else {
        t1 *= t1;
        const g = grad3[gi1];
        n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
      }

      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 < 0) n2 = 0;
      else {
        t2 *= t2;
        const g = grad3[gi2];
        n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
      }

      return 70 * (n0 + n1 + n2);
    }

    return { noise2D };
  }

  const noise = Simplex2D(1337);

  /* ----------------------------- */
  /*        CURL NOISE (2D)        */
  /* ----------------------------- */

  function curlNoise(x, y, t, scale) {
    const eps = 0.0005;

    const n1 = noise.noise2D((x + eps) * scale, y * scale + t);
    const n2 = noise.noise2D((x - eps) * scale, y * scale + t);
    const a = (n1 - n2) / (2 * eps);

    const n3 = noise.noise2D(x * scale + t, (y + eps) * scale);
    const n4 = noise.noise2D(x * scale + t, (y - eps) * scale);
    const b = (n3 - n4) / (2 * eps);

    return { x: b, y: -a };
  }

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
      curlStrengthMacro: 1.0,
      curlStrengthMeso: 0.5,
      curlStrengthMicro: 0.25,

      obstaclesEnabled: true,
      trailsEnabled: true,
      paused: false,
      particles: [],
      preset: "drift",
    },

    start() {
      console.log("APEXCORE v4.6 — APEXSIM online.");
      this._initParticles();
    },

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
    /*     UI CONTROL SURFACE        */
    /* ----------------------------- */

    pause() { this._state.paused = true; },

    resume() {
      const s = this._state;
      s.paused = false;

      // Resume Kick — subtle reactivation
      for (const p of s.particles) {
        p.vx *= 1.05;
        p.vy *= 1.05;
      }
    },

    reset() { this._initParticles(); },

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

    setSpeed(v) { this._state.particleSpeed = v; },
    setParticleCount(v) { this._state.particleCount = v; this._initParticles(); },
    setFieldStrength(v) { this._state.fieldStrength = v; },
    enableObstacles(v) { this._state.obstaclesEnabled = v; },
    enableTrails(v) { this._state.trailsEnabled = v; },

    /* ----------------------------- */
    /*          PRESETS              */
    /* ----------------------------- */

    applyPreset(preset) {
      const s = this._state;

      switch (preset) {
        case "swarm":
          s.fieldStrength = 1.0;
          s.curlStrengthMacro = 2.2;
          s.curlStrengthMeso = 1.4;
          s.curlStrengthMicro = 0.8;
          s.particleSpeed = 1.0;
          break;

        case "drift":
          s.fieldStrength = 0.7;
          s.curlStrengthMacro = 0.8;
          s.curlStrengthMeso = 0.4;
          s.curlStrengthMicro = 0.2;
          s.particleSpeed = 0.6;
          break;

        case "pulse":
          s.fieldStrength = 2.0;
          s.curlStrengthMacro = 2.8;
          s.curlStrengthMeso = 1.8;
          s.curlStrengthMicro = 1.0;
          s.particleSpeed = 1.7;
          break;

        case "orbit":
          s.fieldStrength = 1.2;
          s.curlStrengthMacro = 1.6;
          s.curlStrengthMeso = 0.9;
          s.curlStrengthMicro = 0.4;
          s.particleSpeed = 2.0;
          break;
      }
    },

    /* ----------------------------- */
    /*     FLOW + FRACTAL CURL       */
    /* ----------------------------- */

    sampleFlow(x, y) {
      const s = this._state;
      const baseScale = 0.0015;
      const time = performance.now();

      // Different evolution speeds per layer
      const tFlow = time * 0.00015;
      const tMacro = time * 0.00010;
      const tMeso = time * 0.00030;
      const tMicro = time * 0.00090;

      // Simplex directional flow (base field)
      const angle =
        noise.noise2D(x * baseScale + tFlow, y * baseScale) * Math.PI +
        noise.noise2D(x * baseScale, y * baseScale + tFlow) * Math.PI;

      const fx = Math.cos(angle) * s.fieldStrength;
      const fy = Math.sin(angle) * s.fieldStrength;

      // Fractal curl noise: macro / meso / micro
      const curlMacro = curlNoise(x, y, tMacro, baseScale * 0.5);
      const curlMeso  = curlNoise(x, y, tMeso,  baseScale * 1.0);
      const curlMicro = curlNoise(x, y, tMicro, baseScale * 2.0);

      const cx =
        curlMacro.x * s.curlStrengthMacro +
        curlMeso.x  * s.curlStrengthMeso +
        curlMicro.x * s.curlStrengthMicro;

      const cy =
        curlMacro.y * s.curlStrengthMacro +
        curlMeso.y  * s.curlStrengthMeso +
        curlMicro.y * s.curlStrengthMicro;

      return {
        fx: fx + cx,
        fy: fy + cy,
      };
    },
  };

  window.APEXSIM = APEXSIM;
  APEX.register("apexsim", APEXSIM);
})();
