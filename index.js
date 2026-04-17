// index.js — APEXCORE Runtime + APEXSIM + Renderer Boot

import { startAPEXSIM } from "./apexsim.js";
import { startAPEXSIMRenderer } from "./apexsim-renderer.js";

console.log("StateEngine — module entry loaded");

// Wait for DOM so canvas exists
window.addEventListener("DOMContentLoaded", () => {
    console.log("APEXCORE — Booting Module Runtime…");

    // Start simulation logic
    startAPEXSIM();

    // Start renderer (world + Steel‑Tablet HUD)
    startAPEXSIMRenderer();

    console.log("APEXCORE — Module Runtime Online");
});
