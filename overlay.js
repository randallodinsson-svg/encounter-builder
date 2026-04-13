/*
    APEXCORE v4.2 — Overlay System (FULLNUKE Edition)
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

        heartbeatEl = document.createElement("div");
        heartbeatEl.style.position = "absolute";
        heartbeatEl.style.top = "10px";
        heartbeatEl.style.left = "10px";
        heartbeatEl.style.color = "#0f0";
        heartbeatEl.style.fontFamily = "monospace";
        heartbeatEl.textContent = "♥";
        root.appendChild(heartbeatEl);

        debugEl = document.createElement("div");
        debugEl.style.position = "absolute";
        debugEl.style.bottom = "10px";
        debugEl.style.left = "10px";
        debugEl.style.color = "#0f0";
        debugEl.style.fontFamily = "monospace";
        debugEl.textContent = "APEXCORE v4.2 — Overlay Online";
        root.appendChild(debugEl);

        console.log("Overlay initialized");
    }

    function update(state) {
        if (!heartbeatEl || !debugEl) return;

        const t = state.time * 0.005;
        const pulse = Math.sin(t) * 0.5 + 0.5;
        heartbeatEl.style.fontSize = (14 + pulse * 4) + "px";

        debugEl.textContent = `APEXCORE v4.2 — Δ ${state.delta.toFixed(2)} ms`;
    }

    APEX.register("overlay", { type: "overlay", start, update });

})();
