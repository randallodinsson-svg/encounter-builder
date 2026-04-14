/*
    APEXCORE v4.4 — Environmental Field Engine
    Batch 3 — Step 1 (Dynamic Weather)
    Provides a global environmental field:
        - drifting wind
        - soft turbulence pockets
        - gentle vortices
        - environmental gradients
*/

(function () {

  const TWO_PI = Math.PI * 2;

  const ENV_FIELD = {
    _time: 0,
    _strength: 1.0,       // global multiplier
    _windSpeed: 0.15,     // slow drifting wind
    _turbulenceScale: 0.003,
    _vortexScale: 0.002,
    _windDir: Math.random() * TWO_PI,

    start() {
      console.log("APEXCORE v4.4 — Environmental Field online.");
    },

    update(dt) {
      this._time += dt * 0.001;

      // slowly rotate wind direction over time
      this._windDir += 0.00015 * dt;
    },

    // SIM calls this every frame
    sample(x, y) {
      const t = this._time;

      // -----------------------------
      // 1. Global drifting wind
      // -----------------------------
      const windX = Math.cos(this._windDir) * this._windSpeed;
      const windY = Math.sin(this._windDir) * this._windSpeed;

      // -----------------------------
      // 2. Soft turbulence pockets
      // -----------------------------
      const turbAngle =
        this._hash2(x * this._turbulenceScale, y * this._turbulenceScale + t * 0.2) * TWO_PI;

      const turbX = Math.cos(turbAngle) * 0.6;
      const turbY = Math.sin(turbAngle) * 0.6;

      // -----------------------------
      // 3. Gentle vortices
      // -----------------------------
      const vx = (x * this._vortexScale) + Math.sin(t * 0.1);
      const vy = (y * this._vortexScale) + Math.cos(t * 0.1);

      const vortexAngle = this._hash2(vx, vy) * TWO_PI;
      const vortexX = -Math.sin(vortexAngle) * 0.4;
      const vortexY =  Math.cos(vortexAngle) * 0.4;

      // -----------------------------
      // Combine forces
      // -----------------------------
      const fx = (windX + turbX + vortexX) * this._strength;
      const fy = (windY + turbY + vortexY) * this._strength;

      return { fx, fy };
    },

    setStrength(v) {
      this._strength = Math.max(0, Math.min(5, v));
    },

    _hash2(x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    },
  };

  window.ENV_FIELD = ENV_FIELD;
  APEX.register("environment-field", ENV_FIELD);

})();
