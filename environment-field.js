/*
    APEXCORE v4.4 — Environmental Field
    - Global atmospheric field for APEXSIM / HALO
    - Supports:
        • Base wind
        • Turbulence
        • Vortices
        • Storm Mode
        • Weather Presets
        • Dynamic Storm Events (microbursts + rotating cells)
*/

(function () {

  const ENV_FIELD = {
    _time: 0,

    // Base parameters
    _windSpeed: 0.15,
    _windDir: 0.0,          // radians
    _turbulence: 1.0,
    _vortices: 1.0,
    _stormMode: false,

    // Storm events
    _stormEvents: [],       // array of { x, y, radius, strength, rot, life, type }

    start() {
      console.log("APEXCORE v4.4 — Environmental Field online.");
    },

    // Called each tick by engine
    update(dt) {
      this._time += dt;

      // Decay existing storm events
      this._updateStormEvents(dt);

      // If storm mode is on, occasionally spawn new events
      if (this._stormMode) {
        this._maybeSpawnStormEvent(dt);
      }
    },

    // -----------------------------
    // Public API — Controls
    // -----------------------------

    setWindSpeed(v) {
      this._windSpeed = Math.max(0, v || 0);
    },

    setWindDir(rad) {
      this._windDir = rad || 0;
    },

    setTurbulence(v) {
      this._turbulence = Math.max(0, v || 0);
    },

    setVortices(v) {
      this._vortices = Math.max(0, v || 0);
    },

    setStormMode(enabled) {
      this._stormMode = !!enabled;
    },

    setWeatherPreset(name) {
      // Normalize
      const preset = String(name || "").toLowerCase();

      switch (preset) {
        case "calm":
          this._windSpeed = 0.05;
          this._turbulence = 0.3;
          this._vortices = 0.2;
          this._stormMode = false;
          break;

        case "gusty":
          this._windSpeed = 0.4;
          this._turbulence = 1.5;
          this._vortices = 0.8;
          this._stormMode = true;
          break;

        case "storm":
          this._windSpeed = 0.7;
          this._turbulence = 2.2;
          this._vortices = 1.8;
          this._stormMode = true;
          break;

        case "turbulentsea":
        case "turbulentSea":
          this._windSpeed = 0.9;
          this._turbulence = 3.0;
          this._vortices = 2.4;
          this._stormMode = true;
          break;

        case "cyclone":
          this._windSpeed = 0.6;
          this._turbulence = 2.5;
          this._vortices = 3.0;
          this._stormMode = true;
          break;

        default:
          // Fallback to calm
          this._windSpeed = 0.1;
          this._turbulence = 0.6;
          this._vortices = 0.5;
          this._stormMode = false;
          break;
      }

      console.log("ENV_FIELD: Weather Preset →", preset);
    },

    // -----------------------------
    // Public API — Sampling
    // -----------------------------
    // x, y are in "field space" (we treat them as arbitrary world units)
    // Returns { fx, fy }
    // -----------------------------
    sample(x, y) {
      const t = this._time * 0.001;

      // Base wind
      const baseDirX = Math.cos(this._windDir);
      const baseDirY = Math.sin(this._windDir);
      let fx = baseDirX * this._windSpeed;
      let fy = baseDirY * this._windSpeed;

      // Turbulence (simple time-varying noise)
      if (this._turbulence > 0) {
        const n1 = this._hashNoise(x * 0.003, y * 0.003, t * 0.7);
        const n2 = this._hashNoise(x * -0.002, y * 0.0025, t * 0.9);
        fx += (n1 - 0.5) * this._turbulence * 0.8;
        fy += (n2 - 0.5) * this._turbulence * 0.8;
      }

      // Vortices (large-scale swirl)
      if (this._vortices > 0) {
        const scale = 0.0006;
        const vx = x * scale;
        const vy = y * scale;
        const r2 = vx * vx + vy * vy + 1e-6;
        const invR = 1 / Math.sqrt(r2);
        const swirl = this._vortices * 0.9;

        // Perpendicular to radius vector
        fx += -vy * invR * swirl;
        fy += vx * invR * swirl;
      }

      // Storm events (microbursts, rotating cells)
      if (this._stormEvents.length > 0) {
        const stormForce = this._sampleStormEvents(x, y);
        fx += stormForce.fx;
        fy += stormForce.fy;
      }

      return { fx, fy };
    },

    // -----------------------------
    // Storm Events
    // -----------------------------

    _updateStormEvents(dt) {
      const decay = dt * 0.0005;
      for (let i = this._stormEvents.length - 1; i >= 0; i--) {
        const e = this._stormEvents[i];
        e.life -= decay;
        if (e.life <= 0) {
          this._stormEvents.splice(i, 1);
        }
      }
    },

    _maybeSpawnStormEvent(dt) {
      // Probability scaled by turbulence + vortices
      const intensity = (this._turbulence + this._vortices) * 0.5;
      const baseRate = 0.0004; // events per ms
      const chance = baseRate * dt * (0.5 + intensity);

      if (Math.random() < chance) {
        this._spawnStormEvent();
      }
    },

    _spawnStormEvent() {
      // Random position in a broad field space
      const radius = 400 + Math.random() * 800;
      const strength = 0.8 + Math.random() * 2.0;
      const rot = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 1.5);
      const life = 0.6 + Math.random() * 1.4; // in "life units", decays in _updateStormEvents

      const type = Math.random() < 0.5 ? "microburst" : "rotor";

      const e = {
        x: (Math.random() * 2 - 1) * 2000,
        y: (Math.random() * 2 - 1) * 2000,
        radius,
        strength,
        rot,
        life,
        type,
      };

      this._stormEvents.push(e);
    },

    _sampleStormEvents(x, y) {
      let fx = 0;
      let fy = 0;

      for (let i = 0; i < this._stormEvents.length; i++) {
        const e = this._stormEvents[i];
        const dx = x - e.x;
        const dy = y - e.y;
        const dist2 = dx * dx + dy * dy;
        const r = e.radius;

        if (dist2 > r * r) continue;

        const dist = Math.sqrt(dist2) + 1e-6;
        const norm = dist / r;

        // Falloff: strong in center, fades to edge
        const falloff = (1 - norm) * (1 - norm) * e.life;

        if (e.type === "microburst") {
          // Radial outburst
          const dirX = dx / dist;
          const dirY = dy / dist;
          const s = e.strength * falloff;
          fx += dirX * s;
          fy += dirY * s;
        } else {
          // Rotating cell (tangential)
          const dirX = -dy / dist;
          const dirY = dx / dist;
          const s = e.strength * falloff * e.rot;
          fx += dirX * s;
          fy += dirY * s;
        }
      }

      return { fx, fy };
    },

    // -----------------------------
    // Simple hash-based noise
    // -----------------------------
    _hashNoise(x, y, t) {
      const s = Math.sin(x * 12.9898 + y * 78.233 + t * 37.719) * 43758.5453;
      return s - Math.floor(s);
    },
  };

  window.ENV_FIELD = ENV_FIELD;
  APEX.register("environment-field", ENV_FIELD);

})();
