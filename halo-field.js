// FILE: halo-field.js
// HALO_FIELD v4.4 — NUKE Rebuild (Central Attractor)

(function () {
  const HALO = {
    _time: 0,

    // Simple single halo in center for now
    strength: 1.0, // 0..2
    radius: 220,   // visual radius

    start() {
      console.log("HALO_FIELD — online.");
    },

    update(dt) {
      this._time += dt;
    },

    sample(x, y) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;

      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

      // Soft attraction toward center
      const falloff = Math.min(1, dist / this.radius);
      const k = (this.strength * (1 - falloff)) * 0.8;

      return {
        fx: (dx / dist) * k,
        fy: (dy / dist) * k,
      };
    },
  };

  window.HALO_FIELD = HALO;
  APEX.register("halo-field", HALO);
})();
