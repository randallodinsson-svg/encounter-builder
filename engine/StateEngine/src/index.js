// index.js — unified module entry point

// CORE ENGINE + STATE ENGINE
import "./apexcore-engine.js"
import "./apexcore-events.js"
import "./formation-commands.js"
import "./engine/StateEngine/src/index.js"

// SIM + RENDERER
import "./apexsim.js"
import "./apexsim-renderer.js"

// UI + OPS
import "./apex-ui.js"
import "./apexops.js"

// FORMATION + FIELD SYSTEMS
import "./formation-ai.js"
import "./formation-morphing.js"
import "./formation-coordination.js"
import "./formation-memory.js"
import "./formation-renderer.js"
import "./formations.js"

// FIELD + HALO SYSTEMS
import "./field-controller.js"
import "./field-visualizer.js"
import "./field-animator.js"
import "./environment-field.js"
import "./halo-field.js"
import "./halo-renderer.js"
import "./halo-system.js"

// DIAGNOSTICS + DEBUG
import "./debug-console.js"
import "./diag-fps-graph.js"
import "./render-stats.js"
import "./module-inspector.js"
import "./registry-diff-viewer.js"

// ENTITIES + MAPS
import "./entities.js"
import "./influence-maps.js"

// NARRATIVE + COALITION + OPERATOR LAYERS (Phase 14–62)
import "./phase14-strategy.js"
import "./phase15-evolution.js"
import "./phase16-meta-orchestration.js"
import "./phase17-scenario-director.js"
import "./phase18-adaptive-difficulty.js"
import "./phase19-objective-field.js"
import "./phase20-narrative-state.js"
import "./phase21-salience-focus.js"
import "./phase22-cinematic-cues.js"
import "./phase23-operator-telemetry.js"
import "./phase24-operator-influence.js"
import "./phase25-operator-dashboard.js"
import "./phase26-atmosphere-mood.js"
import "./phase27-formation-relationships.js"
import "./phase28-scenario-autogen.js"
import "./phase29-scenario-memory.js"
import "./phase30-scenario-feed.js"
import "./phase31-relationship-visualizer.js"
import "./phase32-emergent-motive.js"
import "./phase33-motive-telemetry.js"
import "./phase34-emergent-coalitions.js"
import "./phase35-coalition-visualizer.js"
import "./phase36-coalition-intelligence.js"
import "./phase37-coalition-rivalry.js"
import "./phase38-coalition-conflict.js"
import "./phase39-coalition-events.js"
import "./phase40-coalition-strategy.js"
import "./phase41-coalition-diplomacy.js"
import "./phase42-coalition-treaties.js"
import "./phase43-coalition-memory.js"
import "./phase44-coalition-identity.js"
import "./phase45-coalition-evolution.js"
import "./phase46-operator-intervention.js"
import "./phase47-operator-presence.js"
import "./phase48-operator-reputation.js"
import "./phase49-epoch-shift.js"
import "./phase50-operator-mythology.js"
import "./phase51-operator-doctrine.js"
import "./phase52-operator-historiography.js"
import "./phase53-historical-myth-fusion.js"
import "./phase54-narrative-alignment-wars.js"
import "./phase55-narrative-propaganda.js"
import "./phase56-intelligence-deepening.js"
import "./phase57-myth-fusion.js"
import "./phase58-cognitive-convergence.js"
import "./phase59-pressure-lensing.js"
import "./phase60-threshold-breaker.js"
import "./phase61-predictive-tension.js"
import "./phase62-temporal-alignment.js"

// BOOT MESSAGE
console.log("APEXCORE — Module Runtime Online")
