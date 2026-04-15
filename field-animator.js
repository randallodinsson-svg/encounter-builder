// field-animator.js — dynamic modulation + cycles

(function () {
  const Animator = {
    time: 0,
    cycleTime: 0,
    cycleDuration: 18,

    start() {
      console.log("FIELD_ANIMATOR — online.");
    },

    update(dt) {
      this.time += dt;
      this.cycleTime += dt;

      const env = APEX.getModule("environment-field");
      const halo = APEX.getModule("halo-field");
      const controller = APEX.getModule("field-controller");

      if (!env || !halo || !controller) return;

      env.windDirectionDeg = (env.windDirectionDeg + dt * 6) % 360;
      env.turbulence = 0.6 + Math.sin(this.time * 1.4) * 0.4;
      env.vortices = 0.8 + Math.sin(this.time * 2.2) * 0.6;
      halo.strength = 1.0 + Math.sin(this.time * 1.1) * 0.4;

      if (this.cycleTime >= this.cycleDuration) {
        this.cycleTime = 0;
        const order = ["Calm", "Drift", "Swirl", "Storm", "Collapse"];
        const next = order[Math.floor(Math.random() * order.length)];
        controller.applyPreset(next);
      }
    },
  };

  APEX.register("field-animator", Animator);
})();
