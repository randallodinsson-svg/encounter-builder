/*
    APEXCORE v4.4 — APEX UI Controller
    Batch 2 — Step 3: Interaction Tuning Layer
    - Controls HALO visibility, SIM visibility, Dual-Field mode
    - Controls particle count, speed, field strength
    - Field Strength now also drives HALO_FIELD.setStrength(...)
*/

(function () {

  const UI = {
    _els: {},

    start() {
      console.log("APEXCORE v4.4 — UI online.");

      this._cacheElements();
      this._wireEvents();
      this._initDefaults();
    },

    _cacheElements() {
      const $ = (id) => document.getElementById(id);

      this._els.haloVisible = $("haloVisible");
      this._els.simVisible = $("simVisible");
      this._els.dualMode = $("dualMode");

      this._els.presetDrift = $("presetDrift");
      this._els.presetPulse = $("presetPulse");
      this._els.presetOrbit = $("presetOrbit");
      this._els.presetSwarm = $("presetSwarm");

      this._els.particleCount = $("particleCount");
      this._els.particleCountLabel = $("particleCountLabel");

      this._els.particleSpeed = $("particleSpeed");
      this._els.particleSpeedLabel = $("particleSpeedLabel");

      this._els.fieldStrength = $("fieldStrength");
      this._els.fieldStrengthLabel = $("fieldStrengthLabel");

      this._els.obstaclesEnabled = $("obstaclesEnabled");
      this._els.trailsEnabled = $("trailsEnabled");

      this._els.pauseBtn = $("pauseBtn");
      this._els.spawnBurstBtn = $("spawnBurstBtn");
      this._els.resetBtn = $("resetBtn");
    },

    _wireEvents() {
      const sim = window.APEXSIM;
      const haloField = window.HALO_FIELD || null;

      const vis = (window.APEX_VIS = window.APEX_VIS || {
        halo: true,
        sim: true,
        dual: true,
      });

      // Visibility toggles
      if (this._els.haloVisible) {
        this._els.haloVisible.addEventListener("change", (e) => {
          vis.halo = !!e.target.checked;
          console.log("UI: HALO Visible →", vis.halo);
        });
      }

      if (this._els.simVisible) {
        this._els.simVisible.addEventListener("change", (e) => {
          vis.sim = !!e.target.checked;
          console.log("UI: SIM Visible →", vis.sim);
        });
      }

      if (this._els.dualMode) {
        this._els.dualMode.addEventListener("change", (e) => {
          vis.dual = !!e.target.checked;
          console.log("UI: Dual Mode →", vis.dual);
        });
      }

      // Presets
      const bindPreset = (el, name) => {
        if (!el) return;
        el.addEventListener("click", () => {
          if (sim && sim.setPreset) {
            sim.setPreset(name);
            console.log("UI: Set Preset →", name);
          }
        });
      };

      bindPreset(this._els.presetDrift, "drift");
      bindPreset(this._els.presetPulse, "pulse");
      bindPreset(this._els.presetOrbit, "orbit");
      bindPreset(this._els.presetSwarm, "swarm");

      // Particle Count
      if (this._els.particleCount) {
        this._els.particleCount.addEventListener("input", (e) => {
          const v = parseInt(e.target.value, 10) || 0;
          if (this._els.particleCountLabel) {
            this._els.particleCountLabel.textContent = v;
          }
          if (sim && sim.setParticleCount) {
            sim.setParticleCount(v);
          }
        });
      }

      // Particle Speed
      if (this._els.particleSpeed) {
        this._els.particleSpeed.addEventListener("input", (e) => {
          const v = parseFloat(e.target.value) || 1.0;
          if (this._els.particleSpeedLabel) {
            this._els.particleSpeedLabel.textContent = v.toFixed(2) + "x";
          }
          if (sim && sim.setSpeed) {
            sim.setSpeed(v);
          }
        });
      }

      // Field Strength → SIM + HALO_FIELD
      if (this._els.fieldStrength) {
        this._els.fieldStrength.addEventListener("input", (e) => {
          const v = parseFloat(e.target.value) || 1.0;
          if (this._els.fieldStrengthLabel) {
            this._els.fieldStrengthLabel.textContent = v.toFixed(2);
          }

          if (sim && sim.setFieldStrength) {
            sim.setFieldStrength(v);
          }

          if (haloField && haloField.setStrength) {
            // tie HALO influence to same control (interaction tuning)
            haloField.setStrength(v);
          }

          console.log("UI: Field Strength →", v);
        });
      }

      // Obstacles / Trails
      if (this._els.obstaclesEnabled) {
        this._els.obstaclesEnabled.addEventListener("change", (e) => {
          const enabled = !!e.target.checked;
          if (sim && sim.enableObstacles) {
            sim.enableObstacles(enabled);
          }
          console.log("UI: Obstacles Enabled →", enabled);
        });
      }

      if (this._els.trailsEnabled) {
        this._els.trailsEnabled.addEventListener("change", (e) => {
          const enabled = !!e.target.checked;
          if (sim && sim.enableTrails) {
            sim.enableTrails(enabled);
          }
          console.log("UI: Trails Enabled →", enabled);
        });
      }

      // Buttons: Pause / Spawn Burst / Reset
      if (this._els.pauseBtn) {
        this._els.pauseBtn.addEventListener("click", () => {
          if (!sim) return;
          if (sim._state && sim._state.paused) {
            sim.resume && sim.resume();
            console.log("UI: Resume SIM");
          } else {
            sim.pause && sim.pause();
            console.log("UI: Pause SIM");
          }
        });
      }

      if (this._els.spawnBurstBtn) {
        this._els.spawnBurstBtn.addEventListener("click", () => {
          if (sim && sim.spawnBurst) {
            sim.spawnBurst(128);
            console.log("UI: Spawn Burst");
          }
        });
      }

      if (this._els.resetBtn) {
        this._els.resetBtn.addEventListener("click", () => {
          if (sim && sim.reset) {
            sim.reset();
            console.log("UI: Reset SIM");
          }
        });
      }
    },

    _initDefaults() {
      const vis = (window.APEX_VIS = window.APEX_VIS || {
        halo: true,
        sim: true,
        dual: true,
      });

      if (this._els.haloVisible) this._els.haloVisible.checked = vis.halo;
      if (this._els.simVisible) this._els.simVisible.checked = vis.sim;
      if (this._els.dualMode) this._els.dualMode.checked = vis.dual;

      if (this._els.particleCount && this._els.particleCountLabel) {
        const v = parseInt(this._els.particleCount.value, 10) || 512;
        this._els.particleCountLabel.textContent = v;
      }

      if (this._els.particleSpeed && this._els.particleSpeedLabel) {
        const v = parseFloat(this._els.particleSpeed.value) || 1.0;
        this._els.particleSpeedLabel.textContent = v.toFixed(2) + "x";
      }

      if (this._els.fieldStrength && this._els.fieldStrengthLabel) {
        const v = parseFloat(this._els.fieldStrength.value) || 1.0;
        this._els.fieldStrengthLabel.textContent = v.toFixed(2);
      }
    },
  };

  window.APEX_UI = UI;
  APEX.register("ui", UI);

})();
