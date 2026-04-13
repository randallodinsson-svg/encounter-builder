/*
    APEXCORE v4.2 — Overlay Layer
    Lightweight UI layer that sits above the HALO renderer.
*/

(function () {
    let overlayRoot = null;
    let debugPanel = null;
    let debugVisible = true;

    function createOverlayRoot() {
        overlayRoot = document.createElement("div");
        overlayRoot.id = "apex-overlay-root";
        overlayRoot.style.position = "absolute";
        overlayRoot.style.top = "0";
        overlayRoot.style.left = "0";
        overlayRoot.style.width = "100%";
        overlayRoot.style.height = "100%";
        overlayRoot.style.pointerEvents = "none";
        overlayRoot.style.zIndex = "999";
        document.body.appendChild(overlayRoot);
    }

    function createDebugPanel() {
        debugPanel = document.createElement("div");
        debugPanel.id = "apex-debug-panel";
        debugPanel.style.position = "absolute";
        debugPanel.style.top = "10px";
        debugPanel.style.left = "10px";
        debugPanel.style.padding = "8px 12px";
        debugPanel.style.background = "rgba(0,0,0,0.65)";
        debugPanel.style.border = "1px solid rgba(0,255,180,0.4)";
        debugPanel.style.borderRadius = "4px";
        debugPanel.style.fontFamily = "system-ui, sans-serif";
        debugPanel.style.fontSize = "12px";
        debugPanel.style.color = "#e6e6e6";
        debugPanel.style.pointerEvents = "auto";
        debugPanel.style.whiteSpace = "pre";
        debugPanel.style.minWidth = "180px";
        overlayRoot.appendChild(debugPanel);
    }

    function toggleDebug() {
        debugVisible = !debugVisible;
        debugPanel.style.display = debugVisible ? "block" : "none";
    }

    function updateDebug(state) {
        if (!debugVisible) return;

        debugPanel.textContent =
            `APEXCORE v4.2\n` +
            `time:   ${Math.round(state.time)} ms\n` +
            `delta:  ${state.delta.toFixed(2)} ms\n` +
            `frame:  ${state.frame}\n` +
            `mods:   ${Object.keys(APEX.modules).length}`;
    }

    // Keyboard hook for overlay
    function onKeyDown(e) {
        if (e.key === "`") {
            toggleDebug();
        }
    }

    const OverlayModule = {
        type: "overlay",
        update(state) {
            updateDebug(state);
        }
    };

    function init() {
        createOverlayRoot();
        createDebugPanel();
        window.addEventListener("keydown", onKeyDown);
        console.log("APEXCORE v4.2 — Overlay Layer initialized");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    APEX.register("overlay", OverlayModule);
})();
