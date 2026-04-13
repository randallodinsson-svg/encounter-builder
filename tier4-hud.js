/*
    APEXCORE — Tier 4 HUD Shell
    Lightweight, DOM-based HUD overlay for APEXCORE-driven apps.
    Not wired into v4.2; safe to coexist.
*/

(function () {
    if (typeof APEXCORE === "undefined") {
        console.warn("APEXCORE Tier 4 HUD: APEXCORE not found.");
        return;
    }

    let rootEl = null;
    let infoEl = null;

    function createHud(container) {
        rootEl = document.createElement("div");
        rootEl.style.position = "absolute";
        rootEl.style.top = "10px";
        rootEl.style.right = "10px";
        rootEl.style.padding = "8px 10px";
        rootEl.style.background = "rgba(0, 0, 0, 0.65)";
        rootEl.style.border = "1px solid rgba(0, 255, 180, 0.4)";
        rootEl.style.borderRadius = "4px";
        rootEl.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        rootEl.style.fontSize = "11px";
        rootEl.style.color = "#e6e6e6";
        rootEl.style.pointerEvents = "none";
        rootEl.style.zIndex = "9999";

        const title = document.createElement("div");
        title.textContent = "APEXCORE — Tier 4 HUD";
        title.style.fontWeight = "600";
        title.style.marginBottom = "4px";
        title.style.letterSpacing = "0.08em";
        title.style.textTransform = "uppercase";

        infoEl = document.createElement("div");
        infoEl.style.whiteSpace = "pre";

        rootEl.appendChild(title);
        rootEl.appendChild(infoEl);

        container.appendChild(rootEl);
    }

    function updateHud(snapshot) {
        if (!infoEl) return;

        const lines = [
            `time:   ${Math.round(snapshot.time)} ms`,
            `frame:  ${snapshot.frame}`,
            `delta:  ${snapshot.delta.toFixed(2)} ms`,
            `running:${snapshot.running ? " yes" : " no"}`,
            `mods:   ${snapshot.modules.length}`
        ];

        infoEl.textContent = lines.join("\n");
    }

    const Tier4HUD = {
        type: "hud",
        attach(container) {
            if (!container) {
                console.warn("APEXCORE Tier 4 HUD: no container provided.");
                return;
            }
            if (!rootEl) {
                createHud(container);
            }
        },
        update() {
            const snapshot = APEXCORE.snapshot();
            updateHud(snapshot);
        }
    };

    APEXCORE.register("tier4Hud", Tier4HUD);

    // Auto-update via tick listener (does not start engine)
    APEXCORE.onTick(() => {
        Tier4HUD.update();
    });

    console.log("APEXCORE — Tier 4 HUD registered");
})();
