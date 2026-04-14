/*
    APEXCORE v4.4 — Environmental Field Engine
    Batch 3 — Step 3 (Environment Controls + Weather Presets)
*/

(function () {

  const TWO_PI = Math.PI * 2;

  const ENV_FIELD = {
    _time: 0,

    // Global multipliers
    _strength: 1.0,

    // Wind
    _windSpeed: 0.15,
    _windDir: Math.random() * TWO_PI,

    // Turbulence
    _turbulenceScale: 0.003,
    _turbulenceIntensity: 1.0,

    // Vortices
    _vortexScale: 0.002,
    _vortexIntensity: 1.0,

    // Storm mode
    _stormMode: false,
    _stormGustTimer: 0,
    _stormGustValue: 0,

    start() {
      console.log("APEXCORE v4.4 — Environmental Field online.");
    },

    update(dt) {
      this._time += dt * 0.001;

      // Slowly rotate wind direction
      this._windDir += 0.00015 * dt;

      // Storm gusts
      if (this._stormMode) {
        this._stormGustTimer -= dt;
        if (this._stormGustTimer <= 0) {
          this._stormGustTimer = 500 + Math.random() * 1500;
          this._stormGustValue = (Math.random() - 0.5) * 1.5;
        }
      }
    },

    sample(x, y) {
      const t = this._time;

      // -----------------------------
      // 1. Global drifting wind
      // -----------------------------
      let windSpeed = this._windSpeed;

      if (this._stormMode) {
        windSpeed *= 2.0 + this._stormGustValue;
      }

      const windX = Math.cos(this._windDir) * windSpeed;
      const windY = Math.sin(this._windDir) * windSpeed;

      // -----------------------------
      // 2. Turbulence pockets
      // -----------------------------
      const turbAngle =
        this._hash2(
          x * this._turbulenceScale,
          y * this._turbulenceScale + t * 0.2
        ) * TWO_PI;

      const turbX = Math.cos(turbAngle) * 0.6 * this._turbulenceIntensity;
      const turbY = Math.sin(turbAngle) * 0.6 * this._turbulenceIntensity;

      // -----------------------------
      // 3. Vortices
      // -----------------------------
      const vx = (x * this._vortexScale) + Math.sin(t * 0.1);
      const vy = (y * this._vortexScale) + Math.cos(t * 0.1);

      const vortexAngle = this._hash2(vx, vy) * TWO_PI;
      const vortexX = -Math.sin(vortexAngle) * 0.4 * this._vortexIntensity;
      const vortexY =  Math.cos(vortexAngle) * 0.4 * this._vortexIntensity;

      // -----------------------------
      // Combine forces
      // -----------------------------
      const fx = (windX + turbX + vortexX) * this._strength;
      const fy = (windY + turbY + vortexY) * this._strength;

      return { fx, fy };
    },

    // -----------------------------
    // UI‑exposed controls
    // -----------------------------
    setStrength(v) { this._strength = v; },
    setWindSpeed(v) { this._windSpeed = v; },
    setWindDir(v) { this._windDir = v; },
    setTurbulence(v) { this._turbulenceIntensity = v; },
    setVortices(v) { this._vortexIntensity = v; },
    setStormMode(v) { this._stormMode = !!v; },

    // -----------------------------
    // Weather Presets
    // -----------------------------
    setWeatherPreset(name) {
      switch (name) {

        case "calm":
          this._windSpeed = 0.05;
          this._turbulenceIntensity = 0.2;
          this._vortexIntensity = 0.1;
          this._stormMode = false;
          break;

        case "gusty":
          this._windSpeed = 0.4;
          this._turbulenceIntensity = 1.2;
          this._vortexIntensity = 0.6;
          this._stormMode = false;
          break;

        case "storm":
          this._windSpeed = 0.8;
          this._turbulenceIntensity = 2.0;
          this._vortexIntensity = 1.5;
          this._stormMode = true;
          break;

        case "cyclone":
          this._windSpeed = 0.3;
          this._turbulenceIntensity = 1.0;
          this._vortexIntensity = 3.0;
          this._stormMode = true;
          break;

        case "turbulentSea":
          this._windSpeed = 0.2;
          this._turbulenceIntensity = 3.0;
          this._vortexIntensity = 0.4;
          this._stormMode = false;
          break;

        default:
          console.warn("Unknown weather preset:", name);
      }

      console.log("ENV_FIELD: Weather Preset →", name);
    },

    _hash2(x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    },
  };

  window.ENV_FIELD = ENV_FIELD;
  APEX.register("environment-field", ENV_FIELD);

})();
