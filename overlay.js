/*
    APEXCORE v4.4 — Overlay (Stable HALO Crew)
*/

(function () {

    let root = null;
    let heartbeatEl = null;

    function start() {
        root = document.getElementById("app-root");

        if (!root) {
            console.error("Overlay v4.4 — ERROR: #app-root not found.");
            return;
        }

        heartbeatEl = document.createElement("div");
        heartbeatEl.style.position = "absolute";
        heartbeatEl.style.top = "10px";
        heartbeatEl.style.left = "10px";
        heartbeatEl.style.color = "#ff3333";
        heartbeatEl.style.fontFamily = "monospace";
        heartbeatEl.style.fontSize = "14px";
        heartbeatEl.textContent = "● HALO CREW ONLINE";
        root.appendChild(heartbeatEl);

        console.log("Overlay v4.4 initialized");
    }

    function update(state) {
        if (!heartbeatEl) return;

        const t = state.time * 0.006;
        const pulse = Math.sin(t) * 0.5 + 0.5;
        heartbeatEl.style.opacity = (0.6 + pulse * 0.4).toString();
    }

    APEX.register("overlay", {
        type: "overlay",
        start,
        update
    });

})();
