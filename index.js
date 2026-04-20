// ------------------------------------------------------------
// APEXSIM Unified Entry Point (Module Loader)
// ------------------------------------------------------------

// Engine core
import { initSim, getSimState } from './apexsim.js';

// Renderer
import { renderFrame } from './apexsim-renderer.js';

// UI systems
import './apex-ui.js';
import './tactical-overlays.js';
import './orders-wheel.js';
import './replay-ui.js';
import './timeline-recorder.js';

// Debug overlay (auto-injects)
import './debug-overlay.js';

// ------------------------------------------------------------
// BOOT SEQUENCE
// ------------------------------------------------------------

console.log("APEXSIM — Booting unified module entry");

initSim();

function loop() {
  renderFrame(getSimState());
  requestAnimationFrame(loop);
}

loop();
