// ------------------------------------------------------------
// APEXSIM Restored Legacy Entry Point (Full Reconstruction)
// ------------------------------------------------------------

// Engine core
import { initSim, getSimState, updateSim } from "./apexsim.js";

// Camera + replay + export systems
// These modules MUST exist in your repo.
// If any are missing, I will rebuild them next.
import { getCameraState } from "./camera-controls.js";
import { getReplayState } from "./replay-ui.js";
import { getExportState } from "./timeline-recorder.js";

// Tactical overlays (renderer depends on this)
import { apexcoreDrawOverlays } from "./tactical-overlays.js";

// Optional UI systems (auto-init)
import "./apex-ui.js";
import "./orders-wheel.js";

// Debug overlay
import "./debug-overlay.js";

// ------------------------------------------------------------
// REQUIRED EXPORTS (renderer imports these)
// ------------------------------------------------------------
export {
  getCameraState,
  getReplayState,
  getExportState,
  updateSim as apexcoreUpdate,
  apexcoreDrawOverlays
};

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------
console.log("APEXCORE — Restored legacy entry point");

initSim();

function loop() {
  updateSim();
  const state = getSimState();
  renderFrame(state);
  requestAnimationFrame(loop);
}

import { renderFrame } from "./apexsim-renderer.js";
loop();
