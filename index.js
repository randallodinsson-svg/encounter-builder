// ------------------------------------------------------------
// APEXSIM Legacy-Compatible Entry Point (Reconstructed)
// ------------------------------------------------------------

// Core engine modules
import { initSim, getSimState } from './apexsim.js';
import { renderFrame } from './apexsim-renderer.js';

// Tactical overlays (renderer depends on this export)
import { apexcoreDrawOverlays } from './tactical-overlays.js';

// Optional UI modules (auto-initialize themselves)
import './apex-ui.js';
import './orders-wheel.js';
import './replay-ui.js';
import './timeline-recorder.js';

// Debug overlay (safe, standalone)
import './debug-overlay.js';

// ------------------------------------------------------------
// EXPORTS REQUIRED BY OTHER MODULES
// ------------------------------------------------------------

// Renderer expects this
export { apexcoreDrawOverlays };

// If other modules expect more exports, add them here:
// export { somethingElse } from './some-module.js';

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------

console.log("APEXSIM — Restored legacy entry point");

initSim();

function loop() {
  const state = getSimState();
  renderFrame(state);
  requestAnimationFrame(loop);
}

loop();
