// index.js — APEXCORE Unified Module Entry Point

console.log("APEXCORE — Booting Module Runtime…");

// CORE ENGINE + EVENTS + STATE ENGINE
import "./apexcore-engine.js";
import "./apexcore-events.js";
import "./engine/StateEngine/src/index.js";

// APEXSIM + Renderer
import { startAPEXSIM } from "./apexsim.js";
import { initAPEXSIMRenderer } from "./apexsim-renderer.js";

document.addEventListener("DOMContentLoaded", () => {
    startAPEXSIM();
    initAPEXSIMRenderer();
});

console.log("APEXCORE — Module Runtime Online");
