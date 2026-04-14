/*
    APEXCORE v4.4 — Entity Registry (Diagnostics‑Ready Edition)
*/

(function () {
  const Entities = {
    list: [],

    create(props = {}) {
      const e = {
        id: crypto.randomUUID ? crypto.randomUUID() : `e-${Date.now()}-${Math.random()}`,
        x: props.x || 0,
        y: props.y || 0,
        vx: props.vx || 0,
        vy: props.vy || 0,
        data: props.data || {},
      };
      this.list.push(e);
      return e;
    },

    // New: used by HALO UI (#halo-spawn)
    spawnRandom() {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return this.create({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
      });
    },

    clear() {
      this.list.length = 0;
    },

    forEach(fn) {
      this.list.forEach(fn);
    },

    count() {
      return this.list.length;
    },

    getAll() {
      return this.list;
    },

    onTick(delta) {
      const dt = delta / 16.67;
      for (const e of this.list) {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }
    },
  };

  APEX.register("entities", Entities);
})();
