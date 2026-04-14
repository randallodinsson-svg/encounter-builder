/*
    APEXCORE v4.4 — Entities Registry
    5‑Species, HALO‑Compatible, Behavior‑Ready
*/

(function () {
  const Entities = {
    _list: [],
    _nextId: 1,

    // 5 species scaffold — behavior will hook into this later
    _species: [
      { id: 0, name: "Alpha",  color: "#ffe9a3" },
      { id: 1, name: "Beta",   color: "#ff9f80" },
      { id: 2, name: "Gamma",  color: "#80c8ff" },
      { id: 3, name: "Delta",  color: "#b080ff" },
      { id: 4, name: "Epsilon",color: "#7dffb3" },
    ],

    start() {
      console.log("APEXCORE v4.4 — Entities online.");
    },

    /* ----------------------------- */
    /*          Public API           */
    /* ----------------------------- */

    getAll() {
      return this._list;
    },

    getSpeciesDefs() {
      return this._species;
    },

    clear() {
      this._list.length = 0;
    },

    spawnRandom() {
      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;

      const x = Math.random() * w;
      const y = Math.random() * h;

      const speciesId = Math.floor(Math.random() * this._species.length);

      return this._spawn({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        speciesId,
      });
    },

    spawnAt(x, y, speciesId = 0) {
      speciesId = Math.max(0, Math.min(this._species.length - 1, speciesId));
      return this._spawn({
        x,
        y,
        vx: 0,
        vy: 0,
        speciesId,
      });
    },

    /* ----------------------------- */
    /*        Internal Helpers       */
    /* ----------------------------- */

    _spawn(opts) {
      const e = {
        id: this._nextId++,
        x: opts.x,
        y: opts.y,
        vx: opts.vx,
        vy: opts.vy,
        speciesId: opts.speciesId,
      };

      this._list.push(e);
      return e;
    },
  };

  APEX.register("entities", Entities);
})();
