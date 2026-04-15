// halo-system.js — multi-halo manager

(function () {
  const HaloSystem = {
    halos: [],
    time: 0,

    start() {
      console.log("HALO_SYSTEM — online.");
      this.applyPreset("BinaryPair");
    },

    update(dt) {
      this.time += dt;
      for (const h of this.halos) {
        if (h.orbiting) {
          const parent = this.halos[h.parentIndex];
          if (!parent) continue;
          const angle = this.time * h.orbitSpeed + h.orbitOffset;
          h.x = parent.x + Math.cos(angle) * h.orbitRadius;
          h.y = parent.y + Math.sin(angle) * h.orbitRadius;
        }
      }
    },

    presets: {
      BinaryPair() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;
        return [
          { x: cx - 140, y: cy, strength: 1.2 },
          { x: cx + 140, y: cy, strength: 1.2 },
        ];
      },

      TripleOrbit() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;
        return [
          { x: cx, y: cy, strength: 1.4 },
          {
            orbiting: true,
            parentIndex: 0,
            orbitRadius: 220,
            orbitSpeed: 0.6,
            orbitOffset: 0,
            strength: 0.9,
          },
          {
            orbiting: true,
            parentIndex: 0,
            orbitRadius: 220,
            orbitSpeed: 0.6,
            orbitOffset: Math.PI,
            strength: 0.9,
          },
        ];
      },

      RingOfSix() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const halos = [];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          halos.push({
            x: cx + Math.cos(a) * 260,
            y: cy + Math.sin(a) * 260,
            strength: 0.8,
          });
        }
        return halos;
      },

      SwarmNet() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const halos = [];
        for (let i = 0; i < 12; i++) {
          halos.push({
            x: Math.random() * w,
            y: Math.random() * h,
            strength: 0.5 + Math.random() * 0.5,
          });
        }
        return halos;
      },

      CollapseCore() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w * 0.5;
        const cy = h * 0.5;
        return [
          { x: cx, y: cy, strength: 2.0 },
          { x: cx - 220, y: cy, strength: 1.0 },
          { x: cx + 220, y: cy, strength: 1.0 },
          { x: cx, y: cy - 220, strength: 1.0 },
          { x: cx, y: cy + 220, strength: 1.0 },
        ];
      },
    },

    applyPreset(name) {
      const preset = this.presets[name];
      if (!preset) {
        console.warn("HALO_SYSTEM: Unknown preset:", name);
        return;
      }
      this.halos = preset();
    },

    sample(x, y) {
      let fx = 0;
      let fy = 0;
      for (const h of this.halos) {
        const dx = h.x - x;
        const dy = h.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const k = (h.strength * 1.2) / dist;
        fx += (dx / dist) * k;
        fy += (dy / dist) * k;
      }
      return { fx, fy };
    },
  };

  APEX.register("halo-system", HaloSystem);
})();
