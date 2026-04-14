/*
    APEXCORE v4.4 — Auto Spawn (Updated for 5‑Species Entities)
*/

(function () {

  const AutoSpawn = {
    _timer: 0,
    _interval: 1200, // ms

    start() {
      console.log("APEXCORE v4.4 — Auto Spawn online.");
    },

    onTick(delta) {
      this._timer += delta;
      if (this._timer >= this._interval) {
        this._timer = 0;
        this.spawnBatch();
      }
    },

    spawnBatch() {
      const Entities = APEX.get("entities");
      if (!Entities) return;

      // NEW: use spawnRandom() instead of create()
      for (let i = 0; i < 3; i++) {
        Entities.spawnRandom();
      }
    },
  };

  APEX.register("auto-spawn", AutoSpawn);

})();
