// FILE: field-animator.js
// FIELD_ANIMATOR v4.4 — Phase 6 (Dynamic Modulation + Cycles)

(function () {
  const Animator = {
    time: 0,
    cycleTime: 0,
    cycleDuration: 18, // seconds per full environment cycle

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

      // -----------------------------
      // 1. WIND ROTATION
      // -----------------------------
      env.windDirectionDeg = (env.windDirectionDeg + dt * 6) % 360;

      // -----------------------------
      // 2. TURBULENCE OSCILLATION
      // -----------------------------
      env.turbulence = 0.6 + Math.sin(this.time * 1.4) * 0.4;

      // -----------------------------
      // 3. VORTEX PULSE
      // -----------------------------
      env.vortices = 0.8 + Math.sin(this.time * 2.2) * 0.6;

      // -----------------------------
      // 4. HALO BREATHING
      // -----------------------------
      halo.strength = 1.0 + Math.sin(this.time * 1.1) * 0.4;

      // -----------------------------
      // 5. ENVIRONMENT CYCLE
      // -----------------------------
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
