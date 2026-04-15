// apex-ui.js — binds buttons to ops / presets / halo presets

(function () {
  const UI = {
    start() {
      console.log("APEX UI — online.");

      this.bindButton("reset", () => {
        const ops = APEX.getModule("apexops");
        if (ops) ops.reset();
      });

      this.bindButton("burst", () => {
        const ops = APEX.getModule("apexops");
        if (ops) ops.burst();
      });

      this.bindButton("preset-calm", () => this.applyFieldPreset("Calm"));
      this.bindButton("preset-drift", () => this.applyFieldPreset("Drift"));
      this.bindButton("preset-swirl", () => this.applyFieldPreset("Swirl"));
      this.bindButton("preset-storm", () => this.applyFieldPreset("Storm"));
      this.bindButton("preset-collapse", () => this.applyFieldPreset("Collapse"));
      this.bindButton("preset-pulse", () => this.applyFieldPreset("Pulse"));

      this.bindButton("halo-binary", () => this.applyHaloPreset("BinaryPair"));
      this.bindButton("halo-triple", () => this.applyHaloPreset("TripleOrbit"));
      this.bindButton("halo-ring", () => this.applyHaloPreset("RingOfSix"));
      this.bindButton("halo-net", () => this.applyHaloPreset("SwarmNet"));
      this.bindButton("halo-collapse", () => this.applyHaloPreset("CollapseCore"));
    },

    bindButton(key, fn) {
      const btn = document.querySelector(`[data-ui="${key}"]`);
      if (!btn) return;
      btn.addEventListener("click", fn);
    },

    applyFieldPreset(name) {
      const controller = APEX.getModule("field-controller");
      if (controller) controller.applyPreset(name);
    },

    applyHaloPreset(name) {
      const haloSystem = APEX.getModule("halo-system");
      if (haloSystem) haloSystem.applyPreset(name);
    },
  };

  APEX.register("apex-ui", UI);
})();
