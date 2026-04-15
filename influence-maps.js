// influence-maps.js — Phase 10 (Multi‑Resolution Influence Maps)

(function () {
  const Influence = {
    coarseSize: 64,
    fineSize: 128,

    coarse: [],
    fine: [],

    w: 0,
    h: 0,
    cw: 0,
    ch: 0,
    fw: 0,
    fh: 0,

    start() {
      console.log("INFLUENCE_MAPS — online (Phase 10).");

      this.resize();
      window.addEventListener("resize", () => this.resize());
    },

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;

      this.cw = this.coarseSize;
      this.ch = this.coarseSize;

      this.fw = this.fineSize;
      this.fh = this.fineSize;

      this.coarse = new Array(this.cw * this.ch).fill(0);
      this.fine = new Array(this.fw * this.fh).fill(0);
    },

    update(dt) {
      this.computeCoarse();
      this.computeFine();
    },

    // ---------------------------------------------------------
    // COARSE MAP — GLOBAL PRESSURE / DANGER / OPPORTUNITY
    // ---------------------------------------------------------
    computeCoarse() {
      const env = APEX.getModule("environment-field");
      const haloSystem = APEX.getModule("halo-system");
      const formations = APEX.getModule("formation-ai")?.formations || [];

      const cw = this.cw;
      const ch = this.ch;
      const w = this.w;
      const h = this.h;

      const cellW = w / cw;
      const cellH = h / ch;

      for (let j = 0; j < ch; j++) {
        for (let i = 0; i < cw; i++) {
          const idx = j * cw + i;
          const x = i * cellW + cellW * 0.5;
          const y = j * cellH + cellH * 0.5;

          let v = 0;

          // Halo attraction/repulsion
          if (haloSystem) {
            for (const hObj of haloSystem.halos) {
              const dx = hObj.x - x;
              const dy = hObj.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;
              v += (hObj.strength * 200) / dist;
            }
          }

          // Environment field pressure
          if (env) {
            const f = env.sample(x, y);
            v += (Math.abs(f.fx) + Math.abs(f.fy)) * 0.4;
          }

          // Formation pressure (avoid crowding)
          for (const f of formations) {
            const dx = f.x - x;
            const dy = f.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            v += 180 / dist;
          }

          this.coarse[idx] = v;
        }
      }
    },

    // ---------------------------------------------------------
    // FINE MAP — LOCAL STEERING / COLLISION RISK / TURBULENCE
    // ---------------------------------------------------------
    computeFine() {
      const env = APEX.getModule("environment-field");
      const haloSystem = APEX.getModule("halo-system");
      const formations = APEX.getModule("formation-ai")?.formations || [];

      const fw = this.fw;
      const fh = this.fh;
      const w = this.w;
      const h = this.h;

      const cellW = w / fw;
      const cellH = h / fh;

      for (let j = 0; j < fh; j++) {
        for (let i = 0; i < fw; i++) {
          const idx = j * fw + i;
          const x = i * cellW + cellW * 0.5;
          const y = j * cellH + cellH * 0.5;

          let v = 0;

          // Halo gradient (stronger influence)
          if (haloSystem) {
            for (const hObj of haloSystem.halos) {
              const dx = hObj.x - x;
              const dy = hObj.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;
              v += (hObj.strength * 400) / dist;
            }
          }

          // Environment turbulence pockets
          if (env) {
            const f = env.sample(x, y);
            v += (Math.abs(f.fx) + Math.abs(f.fy)) * 0.8;
          }

          // Formation collision risk
          for (const f of formations) {
            const dx = f.x - x;
            const dy = f.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            if (dist < f.separationRadius * 1.2) {
              v += 600 / dist;
            }
          }

          this.fine[idx] = v;
        }
      }
    },

    // ---------------------------------------------------------
    // SAMPLING
    // ---------------------------------------------------------
    sampleCoarse(x, y) {
      const i = Math.floor((x / this.w) * this.cw);
      const j = Math.floor((y / this.h) * this.ch);
      const idx = j * this.cw + i;
      return this.coarse[idx] || 0;
    },

    sampleFine(x, y) {
      const i = Math.floor((x / this.w) * this.fw);
      const j = Math.floor((y / this.h) * this.fh);
      const idx = j * this.fw + i;
      return this.fine[idx] || 0;
    },

    // ---------------------------------------------------------
    // TACTICAL HELPERS
    // ---------------------------------------------------------
    getBestDirection(f) {
      // Sample 8 directions around the formation
      const dirs = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
      ];

      let best = null;
      let bestVal = Infinity;

      for (const [dx, dy] of dirs) {
        const tx = f.x + dx * 80;
        const ty = f.y + dy * 80;
        const v = this.sampleFine(tx, ty);
        if (v < bestVal) {
          bestVal = v;
          best = { x: dx, y: dy };
        }
      }

      return best;
    },

    getSafePocket(f) {
      // Scan a small area around the formation
      let best = { x: f.x, y: f.y };
      let bestVal = Infinity;

      for (let ox = -120; ox <= 120; ox += 40) {
        for (let oy = -120; oy <= 120; oy += 40) {
          const tx = f.x + ox;
          const ty = f.y + oy;
          const v = this.sampleCoarse(tx, ty);
          if (v < bestVal) {
            bestVal = v;
            best = { x: tx, y: ty };
          }
        }
      }

      return best;
    },
  };

  APEX.register("influence-maps", Influence);
})();
