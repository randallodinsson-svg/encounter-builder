/*
    APEXCORE v4.4 — Auto Spawn Controller
*/

(function () {
  const Entities = APEX.get("entities");

  const AutoSpawn = {
    enabled: true,
    interval: 250,
    accumulator: 0,
    batchSize: 4,

    start() {
      console.log("APEXCORE v4.4 — Auto Spawn online.");
    },

    onTick(delta) {
      if (!this.enabled) return;
      this.accumulator += delta;
      if (this.accumulator >= this.interval) {
        this.accumulator = 0;
        this.spawnBatch();
      }
    },

    spawnBatch() {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      for (let i = 0; i < this.batchSize; i++) {
        Entities.create({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
        });
      }
    },
  };

  APEX.register("auto-spawn", AutoSpawn);
})();
