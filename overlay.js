/*
    APEXCORE v4.2 — Overlay System (FULLNUKE Edition)
    Renders heartbeat, debug text, and top-layer UI elements.
*/

(function () {

    let root = null;
    let heartbeatEl = null;
    let debugEl = null;

    function start() {
        root = document.getElementById("app-root");

        if (!root) {
            console.error("Overlay — ERROR: #app-root not found.");
            return;
        }

        // Heartbeat indicator
        heartbeatEl = document.createElement("div");
        heartbeatEl.style.position = "absolute";
        heartbeatEl.style.top = "10px";
        heartbeatEl.style.left = "10px";
        heartbeatEl.style.color = "#0f0";
        heartbeatEl.style.fontFamily = "monospace";
        heartbeatEl.style.fontSize = "14px";
        heartbeatEl.textContent = "♥";
        root.appendChild(heartbeatEl);

        // Debug text
        debugEl = document.createElement("div");
        debugEl.style.position = "absolute";
        debugEl.style.bottom = "10px";
        debugEl.style.left = "10px";
        debugEl.style.color = "#0f0";
        debugEl.style.fontFamily = "monospace";
        debugEl.style.fontSize = "14px";
        debugEl.textContent = "APEXCORE v4.2 — Overlay Online";
        root.appendChild(debugEl);

        console.log("Overlay initialized");
    }

    function update(state) {
        if (!heartbeatEl || !debugEl) return;

        // Heartbeat animation
        const t = state.time * 0.005;
        const pulse = Math.sin(t) * 0.5 + 0.5;
        const size = 14 + pulse * 4;
        heartbeatEl.style.fontSize = size + "px";

        // Debug text
        debugEl.textContent =
            `APEXCORE v4.2 — Δ ${state.delta.toFixed(2)} ms`;
    }

    const OverlayModule = {
        type: "overlay",
        start,
        update
    };

    APEX.register("overlay", OverlayModule);
    console.log("APEXCORE v4.2 — Overlay System registered");

})();
