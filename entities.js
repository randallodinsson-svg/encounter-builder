// FILE: entities.js
// APEXCORE v4.4 — Clean Entities Registry (NUKE Rebuild)

(function () {
  const Entities = {
    _list: [],
    _nextId: 1,

    start() {
      console.log("Entities — online.");
    },

    update(dt) {
      // Entities are passive; SIM drives movement.
      // This exists only to satisfy engine lifecycle.
    },

    getAll() {
      return this._list;
    },

    count() {
      return this._list.length;
    },

    clear() {
      this._list.length = 0;
    },

    spawn(x, y, vx = 0, vy = 0, speciesId = 0) {
      const e = {
        id: this._nextId++,
        x, y, vx, vy, speciesId
      };
      this._list.push(e);
      return e;
    },

    spawnRandom() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return this.spawn(
        Math.random() * w,
        Math.random() * h,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        Math.floor(Math.random() * 5)
      );
    },
  };

  APEX.register("entities", Entities);
})();
