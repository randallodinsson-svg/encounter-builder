/*
    APEXCORE v4.4 — UI Controller (Enhanced)
    Fully wired to APEXSIM + HALO with visibility + dual‑mode.
*/

(function () {
  const UI = {
    start() {
      console.log("APEXCORE v4.4 — UI online.");

      this.bindHALO();
      this.bindSIM();
      this.bindVisibility();
    },

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

    bindSIM() {
      const SIM = APEX.get("apexsim");

      this.bind("#sim-preset-select", (e) => {
        const preset = e.target.value;
        console.log("UI: Set Preset →", preset);
        SIM.setPreset(preset);
      });

      const countSlider = document.getElementById("sim-particle-count");
      const countLabel = document.getElementById("sim-particle-count-value");

      if (countSlider) {
        countSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          countLabel.textContent = v;
          SIM.setParticleCount(v);
        });
      }

      const speedSlider = document.getElementById("sim-particle-speed");
      const speedLabel = document.getElementById("sim-particle-speed-value");

      if (speedSlider) {
        speedSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          speedLabel.textContent = v.toFixed(2) + "x";
          SIM.setSpeed(v);
        });
      }

      const fieldSlider = document.getElementById("sim-field-strength");
      const fieldLabel = document.getElementById("sim-field-strength-value");

      if (fieldSlider) {
        fieldSlider.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          fieldLabel.textContent = v.toFixed(2);
          SIM.setFieldStrength(v);
        });
      }

      this.bind("#sim-obstacles-toggle", (e) => {
        const checked = e.target.checked;
        console.log("UI: Obstacles →", checked);
        SIM.enableObstacles(checked);
      });

      this.bind("#sim-trails-toggle", (e) => {
        const checked = e.target.checked;
        console.log("UI: Trails →", checked);
        SIM.enableTrails(checked);
      });

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

      this.bind("#sim-burst-btn", () => {
        console.log("UI: Spawn Burst");
        SIM.spawnBurst(64);
      });

      this.bind("#sim-reset-btn", () => {
        console.log("UI: Reset SIM");
        SIM.reset();
      });
    },

    bindVisibility() {
      const vis = window.APEX_VIS || (window.APEX_VIS = { halo: true, sim: true, dual: true });

      const haloToggle = document.getElementById("halo-visible-toggle");
      const simToggle = document.getElementById("sim-visible-toggle");
      const dualToggle = document.getElementById("dual-mode-toggle");

      if (haloToggle) {
        haloToggle.checked = vis.halo;
        haloToggle.addEventListener("change", (e) => {
          vis.halo = e.target.checked;
          console.log("UI: HALO Visible →", vis.halo);
        });
      }

      if (simToggle) {
        simToggle.checked = vis.sim;
        simToggle.addEventListener("change", (e) => {
          vis.sim = e.target.checked;
          console.log("UI: SIM Visible →", vis.sim);
        });
      }

      if (dualToggle) {
        dualToggle.checked = vis.dual;
        dualToggle.addEventListener("change", (e) => {
          vis.dual = e.target.checked;
          console.log("UI: Dual Mode →", vis.dual);
        });
      }
    },

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
