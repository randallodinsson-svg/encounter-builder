// ------------------------------------------------------------
// APEXCORE v4.4 — UI CONTROLLER
// ------------------------------------------------------------

(function () {
  const sim = window.APEXSIM;

  // -----------------------------
  // DIAGNOSTICS
  // -----------------------------
  const diagFPS = document.getElementById("diag-fps");
  const diagDelta = document.getElementById("diag-delta");
  const diagEntities = document.getElementById("diag-entities");

  function updateDiagnostics() {
    diagFPS.textContent = `FPS: ${sim._state.fps.toFixed(0)}`;
    diagDelta.textContent = `Δ: ${sim._state.delta.toFixed(2)}ms`;
    diagEntities.textContent = `Entities: ${sim._state.particleCount}`;
    requestAnimationFrame(updateDiagnostics);
  }
  updateDiagnostics();

  // -----------------------------
  // SIMULATION LAYER UI
  // -----------------------------
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

  let paused = false;

  presetSelect.addEventListener("change", () => sim.applyPreset(presetSelect.value));

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

  obstaclesToggle.addEventListener("change", () =>
    sim.setObstaclesEnabled(obstaclesToggle.checked)
  );

  trailsToggle.addEventListener("change", () =>
    sim.setTrailsEnabled(trailsToggle.checked)
  );

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    sim.setPaused(paused);
  });

  burstBtn.addEventListener("click", () => sim.spawnBurst());
  resetBtn.addEventListener("click", () => sim.resetSimulation());
})();
