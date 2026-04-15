// halo-field.js — legacy single-halo field (fallback)

(function () {
  const HaloField = {
    x: null,
    y: null,
    strength: 1.2,

    start() {
      console.log("HALO_FIELD — online.");
      this.x = window.innerWidth * 0.5;
      this.y = window.innerHeight * 0.5;
    },

    sample(x, y) {
      const dx = this.x - x;
      const dy = this.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const k = (this.strength * 160) / dist;
      return {
        fx: (dx / dist) * k,
        fy: (dy / dist) * k,
      };
    },
  };

  APEX.register("halo-field", HaloField);
})();
