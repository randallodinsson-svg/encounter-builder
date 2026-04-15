// environment-field.js — wind / turbulence / vortices

(function () {
  const ENV = {
    windDirectionDeg: 0,
    windStrength: 40,
    turbulence: 0.6,
    vortices: 0.8,

    start() {
      console.log("ENV_FIELD — online.");
    },

    sample(x, y) {
      const angle = (this.windDirectionDeg * Math.PI) / 180;
      let fx = Math.cos(angle) * this.windStrength;
      let fy = Math.sin(angle) * this.windStrength;

      const scale = 0.002;
      const n = Math.sin(x * scale) * Math.cos(y * scale);
      fx += n * this.turbulence * 80;
      fy += -n * this.turbulence * 80;

      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const v = this.vortices * 120 / dist;
      fx += (-dy / dist) * v;
      fy += (dx / dist) * v;

      return { fx, fy };
    },
  };

  APEX.register("environment-field", ENV);
})();
