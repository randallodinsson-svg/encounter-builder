// FILE: field-controller.js
// FIELD_CONTROLLER v4.4 — Phase 4 (Presets + Blending)

(function () {
  const Controller = {
    _blendTime: 0,
    _blendDuration: 1.2,
    _startState: null,
    _targetState: null,

    start() {
      console.log("FIELD_CONTROLLER — online.");
      this.applyPreset("Calm", true);
    },

    update(dt) {
      if (!this._targetState) return;

      this._blendTime += dt;
      const t = Math.min(1, this._blendTime / this._blendDuration);

      this._applyBlend(t);

      if (t >= 1) {
        this._targetState = null;
      }
    },

    // -----------------------------
    // PRESETS
    // -----------------------------
    presets: {
      Calm: {
        windSpeed: 0.05,
        windDirectionDeg: 0,
        turbulence: 0.2,
        vortices: 0.1,
        stormMode: false,
        haloStrength: 0.4,
      },
      Drift: {
        windSpeed: 0.25,
        windDirectionDeg: 45,
        turbulence: 0.6,
        vortices: 0.3,
        stormMode: false,
        haloStrength: 0.6,
      },
      Swirl: {
        windSpeed: 0.1,
        windDirectionDeg: 0,
        turbulence: 1.0,
        vortices: 1.4,
        stormMode: false,
        haloStrength: 0.8,
      },
      Storm: {
        windSpeed: 0.6,
        windDirectionDeg: 90,
        turbulence: 2.0,
        vortices: 1.8,
        stormMode: true,
        haloStrength: 1.2,
      },
      Collapse: {
        windSpeed: 0.0,
        windDirectionDeg: 0,
        turbulence: 0.1,
        vortices: 0.0,
        stormMode: false,
        haloStrength: 2.0,
      },
      Pulse: {
        windSpeed: 0.15,
        windDirectionDeg: 0,
        turbulence: 1.6,
        vortices: 0.8,
        stormMode: false,
        haloStrength: 1.4,
      },
    },

    // -----------------------------
    // APPLY PRESET
    // -----------------------------
    applyPreset(name, instant = false) {
      const env = APEX.getModule("environment-field");
      const halo = APEX.getModule("halo-field");

      if (!env || !halo) return;

      const preset = this.presets[name];
      if (!preset) {
        console.warn("FIELD_CONTROLLER: Unknown preset:", name);
        return;
      }

      if (instant) {
        env.windSpeed = preset.windSpeed;
        env.windDirectionDeg = preset.windDirectionDeg;
        env.turbulence = preset.turbulence;
        env.vortices = preset.vortices;
        env.stormMode = preset.stormMode;
        halo.strength = preset.haloStrength;
        return;
      }

      // Start blending
      this._startState = {
        windSpeed: env.windSpeed,
        windDirectionDeg: env.windDirectionDeg,
        turbulence: env.turbulence,
        vortices: env.vortices,
        stormMode: env.stormMode ? 1 : 0,
        haloStrength: halo.strength,
      };

      this._targetState = preset;
      this._blendTime = 0;
    },

    // -----------------------------
    // BLENDING LOGIC
    // -----------------------------
    _applyBlend(t) {
      const env = APEX.getModule("environment-field");
      const halo = APEX.getModule("halo-field");

      const s = this._startState;
      const e = this._targetState;

      const lerp = (a, b) => a + (b - a) * t;

      env.windSpeed = lerp(s.windSpeed, e.windSpeed);
      env.windDirectionDeg = lerp(s.windDirectionDeg, e.windDirectionDeg);
      env.turbulence = lerp(s.turbulence, e.turbulence);
      env.vortices = lerp(s.vortices, e.vortices);
      env.stormMode = lerp(s.stormMode, e.stormMode) > 0.5;
      halo.strength = lerp(s.haloStrength, e.haloStrength);
    },
  };

  APEX.register("field-controller", Controller);
})();
