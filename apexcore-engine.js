// FILE: apexcore-engine.js
// APEX Engine v4.4 — NUKE baseline loop

(function () {
  if (!window.APEX) {
    console.error("APEX Engine: APEX core not found.");
    return;
  }

  const APEX = window.APEX;

  const Engine = {
    lastTime: null,
    fps: 0,

    start() {
      console.log("APEX Engine v4.4 — Starting...");
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    },

    loop(now) {
      const dtMs = now - this.lastTime;
      this.lastTime = now;
      const dt = dtMs / 1000;
      this.fps = 1000 / (dtMs || 1);

      const names = APEX.listModules();
      for (const name of names) {
        const mod = APEX.getModule(name);
        if (!mod) continue;

        // one-time start
        if (!mod._started && typeof mod.start === "function") {
          mod._started = true;
          try {
            mod.start();
          } catch (err) {
            console.error("APEX Engine: error in start() for module", name, err);
          }
        }

        // per-frame update
        if (typeof mod.update === "function") {
          try {
            mod.update(dt);
          } catch (err) {
            console.error("APEX Engine: error in update() for module", name, err);
          }
        }
      }

      // simple HUD hook
      const hudFps = document.getElementById("hud-fps");
      const hudCount = document.getElementById("hud-count");
      const sim = APEX.getModule("apexsim");
      if (hudFps) hudFps.textContent = `FPS: ${this.fps.toFixed(0)}`;
      if (hudCount && sim && sim._state) {
        hudCount.textContent = `Particles: ${sim._state.particles.length}`;
      }

      requestAnimationFrame(this.loop.bind(this));
    },
  };

  APEX.register("engine", Engine);

  window.addEventListener("load", () => {
    Engine.start();
  });
})();
