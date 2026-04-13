/*
    APEXCORE v4.2 — Engine Glue
    Wires DOM → HALO Renderer → Core Loop.
*/

(function () {
    function onResize() {
        const root = document.getElementById("app-root");
        if (!root) return;

        const renderer = APEX.get("renderer");
        if (renderer && typeof renderer.resize === "function") {
            const rect = root.getBoundingClientRect();
            renderer.resize(rect.width, rect.height);
        }
    }

    function boot() {
        const root = document.getElementById("app-root");
        if (!root) {
            console.error("APEXCORE v4.2 — #app-root not found");
            return;
        }

        const renderer = APEX.get("renderer");
        if (renderer && typeof renderer.init === "function") {
            renderer.init(root);
        } else {
            console.error("APEXCORE v4.2 — Renderer module not registered");
        }

        window.addEventListener("resize", onResize);
        onResize();

        console.log("APEXCORE v4.2 — Engine Online");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
