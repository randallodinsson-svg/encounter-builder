/*
    APEXCORE v4.4 — UI Controller (Corrected Full File)
    Fully wired to APEXSIM + HALO with proper pause/resume logic.
*/

(function () {
  const UI = {
    start() {
      console.log("APEXCORE v4.4 — UI online.");

      this.bindHALO();
      this.bindSIM();
    },

    /* ----------------------------- */
    /*           HALO UI             */
    /* ----------------------------- */
    bindHALO() {
      const Entities = APEX.get("entities");

      this.bind("#halo-spawn", () => {
        console.log("UI: Spawn Entity");
        Entities.spawnRandom();
      });

      this.bind("#halo-clear", () => {
        console.log("UI: Clear HALO");
        Entities.clear();
      });
    },

    /* ----------------------------- */
    /*        SIMULATION UI          */
    /* ----------------------------- */
    bindSIM() {
      const SIM = APEX.get("apexsim");

      /* Preset selector */
      this.bind("#sim-preset-select", (e) => {
        const preset = e.target.value;
        console.log("UI: Set Preset →", preset);
        SIM.setPreset(preset);
      });

      /* Particle Count */
      const countSlider = document.getElementById("sim-particle-count");
      const countLabel = document.getElementById("sim-particle-count-value");

      if (countSlider) {
        countSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          countLabel.textContent = v;
          SIM.setParticleCount(v);
        });
      }

      /* Particle Speed */
      const speedSlider = document.getElementById("sim-particle-speed");
      const speedLabel = document.getElementById("sim-particle-speed-value");

      if (speedSlider) {
        speedSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          speedLabel.textContent = v.toFixed(2) + "x";
          SIM.setSpeed(v);
        });
      }

      /* Field Strength */
      const fieldSlider = document.getElementById("sim-field-strength");
      const fieldLabel = document.getElementById("sim-field-strength-value");

      if (fieldSlider) {
        fieldSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          fieldLabel.textContent = v.toFixed(2);
          SIM.setFieldStrength(v);
        });
      }

      /* Obstacles toggle */
      this.bind("#sim-obstacles-toggle", (e) => {
        const checked = e.target.checked;
        console.log("UI: Obstacles →", checked);
        SIM.enableObstacles(checked);
      });

      /* Trails toggle */
      this.bind("#sim-trails-toggle", (e) => {
        const checked = e.target.checked;
        console.log("UI: Trails →", checked);
        SIM.enableTrails(checked);
      });

      /* Pause / Resume button */
      const pauseBtn = document.getElementById("sim-pause-btn");
      if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
          const s = SIM._state;

          if (s.paused) {
            console.log("UI: Resume SIM");
            SIM.resume();
            pauseBtn.textContent = "Pause";
          } else {
            console.log("UI: Pause SIM");
            SIM.pause();
            pauseBtn.textContent = "Resume";
          }
        });
      }

      /* Burst button */
      this.bind("#sim-burst-btn", () => {
        console.log("UI: Spawn Burst");
        SIM.spawnBurst(64);
      });

      /* Reset button */
      this.bind("#sim-reset-btn", () => {
        console.log("UI: Reset SIM");
        SIM.reset();
      });
    },

    /* ----------------------------- */
    /*       Utility Binder          */
    /* ----------------------------- */
    bind(selector, handler) {
      const el = document.querySelector(selector);
      if (!el) {
        console.warn("UI: Missing element", selector);
        return;
      }
      el.addEventListener("click", handler);
    },
  };

  APEX.register("ui", UI);
})();
