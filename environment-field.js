// FILE: environment-field.js
// ENV_FIELD v4.4 — NUKE Rebuild (Wind / Turbulence)

(function () {
  const ENV = {
    _time: 0,

    // Simple parameters (you can later wire UI to these)
    windSpeed: 0.15,     // 0..1
    windDirectionDeg: 0, // 0..360
    turbulence: 1.0,     // 0..2
    vortices: 1.0,       // 0..2
    stormMode: false,

    start() {
      console.log("ENV_FIELD — online.");
    },

    update(dt) {
      this._time += dt;
    },

    sample(x, y) {
      const t = this._time;

      // Base wind
      const dirRad = (this.windDirectionDeg * Math.PI) / 180;
      let fx = Math.cos(dirRad) * this.windSpeed;
      let fy = Math.sin(dirRad) * this.windSpeed;

      // Turbulence (simple sinusoidal noise)
      const scale = 0.0025 * this.turbulence;
      fx += Math.sin((x + t * 200) * scale) * 0.4 * this.turbulence;
      fy += Math.cos((y - t * 160) * scale) * 0.4 * this.turbulence;

      // Vortices (simple swirl around screen center)
      if (this.vortices > 0) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const dx = x - cx;
        const dy = y - cy;
        const r2 = dx * dx + dy * dy + 1;
        const strength = (this.vortices * 0.6) / Math.sqrt(r2);
        fx += -dy * strength * 0.002;
        fy += dx * strength * 0.002;
      }

      // Storm mode: amplify everything
      if (this.stormMode) {
        fx *= 2.0;
        fy *= 2.0;
      }

      return { fx, fy };
    },
  };

  window.ENV_FIELD = ENV;
  APEX.register("environment-field", ENV);
})();
