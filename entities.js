/*
    APEXCORE v4.4 — Entity Registry
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
    clear() {
      this.list.length = 0;
    },
    forEach(fn) {
      this.list.forEach(fn);
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
