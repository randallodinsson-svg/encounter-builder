// ------------------------------------------------------------
// APEXSIM Restored Entry Point (with required exports)
// ------------------------------------------------------------

// Engine core
import { initSim, getSimState } from './apexsim.js';

// Renderer
import { renderFrame } from './apexsim-renderer.js';

// Tactical overlays (renderer depends on this export)
import { apexcoreDrawOverlays } from './tactical-overlays.js';

// UI systems
import './apex-ui.js';
import './orders-wheel.js';
import './replay-ui.js';
import './timeline-recorder.js';

// Debug overlay
import './debug-overlay.js';

// ------------------------------------------------------------
// EXPORTS REQUIRED BY OTHER MODULES
// ------------------------------------------------------------
export { apexcoreDrawOverlays };

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------
console.log("APEXSIM — Restored entry point");

initSim();

function loop() {
  renderFrame(getSimState());
  requestAnimationFrame(loop);
}

loop();
