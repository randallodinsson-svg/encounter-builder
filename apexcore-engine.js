// apexcore-engine.js — main loop

(function () {
  const Engine = {
    lastTime: 0,
    fpsElem: null,
    countElem: null,
    fpsAccum: 0,
    fpsFrames: 0,
    fpsValue: 0,

    start() {
      console.log("APEX Engine v4.4 — Starting...");

      this.fpsElem = document.getElementById("hud-fps");
      this.countElem = document.getElementById("hud-count");

      APEX.startAll();

      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    },

    loop(now) {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      APEX.updateAll(dt);
      this.updateHUD(dt);

      requestAnimationFrame(this.loop.bind(this));
    },

    updateHUD(dt) {
      this.fpsAccum += dt;
      this.fpsFrames += 1;
      if (this.fpsAccum >= 0.25) {
        this.fpsValue = this.fpsFrames / this.fpsAccum;
        this.fpsAccum = 0;
        this.fpsFrames = 0;
        if (this.fpsElem) {
          this.fpsElem.textContent = "FPS: " + this.fpsValue.toFixed(0);
        }
      }

      const sim = APEX.getModule("apexsim");
      if (sim && this.countElem) {
        this.countElem.textContent = "Particles: " + sim.particles.length;
      }
    },
  };

  window.addEventListener("load", () => Engine.start());
})();
