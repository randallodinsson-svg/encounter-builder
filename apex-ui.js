/*
    APEXCORE v4.4 — UI Deck + SIMULATION LAYER Wiring
*/

(function () {
  const sim = window.APEXSIM;

  const UI = {
    start() {
      console.log("APEXCORE v4.4 — UI online.");
      this.bindSimLayer();
      this.bindDiagnostics();
      this.bindHaloControls();
    },

    bindDiagnostics() {
      const fpsEl = document.getElementById("diag-fps");
      const deltaEl = document.getElementById("diag-delta");
      const entitiesEl = document.getElementById("diag-entities");
      const Entities = APEX.get("entities");

      function update() {
        if (fpsEl && deltaEl && entitiesEl) {
          fpsEl.textContent = `FPS: ${sim._state.fps.toFixed(0)}`;
          deltaEl.textContent = `Δ: ${sim._state.delta.toFixed(2)}ms`;
          entitiesEl.textContent = `Entities: ${Entities.list.length}`;
        }
        requestAnimationFrame(update);
      }
      update();
    },

    bindHaloControls() {
      const Entities = APEX.get("entities");
      const spawnBtn = document.getElementById("halo-spawn");
      const clearBtn = document.getElementById("halo-clear");

      if (spawnBtn) {
        spawnBtn.addEventListener("click", () => {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          for (let i = 0; i < 16; i++) {
            Entities.create({
              x: cx + (Math.random() - 0.5) * 200,
              y: cy + (Math.random() - 0.5) * 200,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
            });
          }
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          Entities.clear();
        });
      }
    },

    bindSimLayer() {
      const presetSelect = document.getElementById("sim-preset-select");
      const particleCountSlider = document.getElementById("sim-particle-count");
      const particleCountValue = document.getElementById("sim-particle-count-value");
      const particleSpeedSlider = document.getElementById("sim-particle-speed");
      const particleSpeedValue = document.getElementById("sim-particle-speed-value");
      const fieldStrengthSlider = document.getElementById("sim-field-strength");
      const fieldStrengthValue = document.getElementById("sim-field-strength-value");
      const obstaclesToggle = document.getElementById("sim-obstacles-toggle");
      const trailsToggle = document.getElementById("sim-trails-toggle");
      const pauseBtn = document.getElementById("sim-pause-btn");
      const burstBtn = document.getElementById("sim-burst-btn");
      const resetBtn = document.getElementById("sim-reset-btn");

      if (!presetSelect) return;

      let paused = false;

      presetSelect.addEventListener("change", () => {
        sim.applyPreset(presetSelect.value);
      });

      particleCountSlider.addEventListener("input", () => {
        const v = parseInt(particleCountSlider.value, 10);
        particleCountValue.textContent = v;
        sim.setParticleCount(v);
      });

      particleSpeedSlider.addEventListener("input", () => {
        const v = parseFloat(particleSpeedSlider.value);
        particleSpeedValue.textContent = `${v.toFixed(2)}x`;
        sim.setParticleSpeed(v);
      });

      fieldStrengthSlider.addEventListener("input", () => {
        const v = parseFloat(fieldStrengthSlider.value);
        fieldStrengthValue.textContent = v.toFixed(2);
        sim.setFieldStrength(v);
      });

      obstaclesToggle.addEventListener("change", () => {
        sim.setObstaclesEnabled(obstaclesToggle.checked);
      });

      trailsToggle.addEventListener("change", () => {
        sim.setTrailsEnabled(trailsToggle.checked);
      });

      pauseBtn.addEventListener("click", () => {
        paused = !paused;
        pauseBtn.textContent = paused ? "Resume" : "Pause";
        sim.setPaused(paused);
      });

      burstBtn.addEventListener("click", () => {
        sim.spawnBurst();
      });

      resetBtn.addEventListener("click", () => {
        sim.resetSimulation();
        particleCountSlider.value = 512;
        particleCountValue.textContent = "512";
        particleSpeedSlider.value = 1.0;
        particleSpeedValue.textContent = "1.00x";
        fieldStrengthSlider.value = 1.0;
        fieldStrengthValue.textContent = "1.00";
        obstaclesToggle.checked = true;
        trailsToggle.checked = true;
        paused = false;
        pauseBtn.textContent = "Pause";
      });
    },
  };

  APEX.register("apex-ui", UI);
})();
