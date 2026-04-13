/*
    APEXCORE v4.4 — UI Deck
    - Diagnostics
    - Module toggles (visual only for now)
    - Future-ready hooks for APEXSIM / tools
*/

(function () {

    function createElement(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    }

    function buildPanel(root) {
        const panel = createElement("div", "apex-ui-panel");

        // Header
        const header = createElement("div", "apex-ui-header");
        const titleRow = createElement("div", "apex-ui-title-row");
        const title = createElement("div", "apex-ui-title", "APEXCORE CONTROL DECK");
        const badge = createElement("div", "apex-ui-badge", "ENGINE ONLINE");
        titleRow.appendChild(title);
        titleRow.appendChild(badge);

        const subtitle = createElement(
            "div",
            "apex-ui-subtitle",
            "v4.4 HALO baseline — formation engine stabilized."
        );

        header.appendChild(titleRow);
        header.appendChild(subtitle);

        // Body
        const body = createElement("div", "apex-ui-body");

        // Section: Diagnostics
        const diagSection = createElement("div", "apex-ui-section");
        const diagHeader = createElement("div", "apex-ui-section-header");
        const diagTitle = createElement("div", "apex-ui-section-title", "Engine Diagnostics");
        const diagStatus = createElement("div", "apex-ui-section-status", "Stable");
        diagHeader.appendChild(diagTitle);
        diagHeader.appendChild(diagStatus);

        const diagGrid = createElement("div", "apex-ui-diagnostics-grid");

        const fpsItem = createElement("div", "apex-ui-diagnostic-item");
        const fpsLabel = createElement("div", "apex-ui-diagnostic-label", "Frame Rate");
        const fpsValue = createElement("div", "apex-ui-diagnostic-value", "-- fps");
        fpsValue.id = "apex-ui-fps";
        fpsItem.appendChild(fpsLabel);
        fpsItem.appendChild(fpsValue);

        const entsItem = createElement("div", "apex-ui-diagnostic-item");
        const entsLabel = createElement("div", "apex-ui-diagnostic-label", "Entities");
        const entsValue = createElement("div", "apex-ui-diagnostic-value", "--");
        entsValue.id = "apex-ui-entities";
        entsItem.appendChild(entsLabel);
        entsItem.appendChild(entsValue);

        const formsItem = createElement("div", "apex-ui-diagnostic-item");
        const formsLabel = createElement("div", "apex-ui-diagnostic-label", "Formations");
        const formsValue = createElement("div", "apex-ui-diagnostic-value", "--");
        formsValue.id = "apex-ui-formations";
        formsItem.appendChild(formsLabel);
        formsItem.appendChild(formsValue);

        const deltaItem = createElement("div", "apex-ui-diagnostic-item");
        const deltaLabel = createElement("div", "apex-ui-diagnostic-label", "Delta");
        const deltaValue = createElement("div", "apex-ui-diagnostic-value", "-- ms");
        deltaValue.id = "apex-ui-delta";
        deltaItem.appendChild(deltaLabel);
        deltaItem.appendChild(deltaValue);

        diagGrid.appendChild(fpsItem);
        diagGrid.appendChild(entsItem);
        diagGrid.appendChild(formsItem);
        diagGrid.appendChild(deltaItem);

        diagSection.appendChild(diagHeader);
        diagSection.appendChild(diagGrid);

        // Section: Modules
        const modSection = createElement("div", "apex-ui-section");
        const modHeader = createElement("div", "apex-ui-section-header");
        const modTitle = createElement("div", "apex-ui-section-title", "Core Modules");
        const modStatus = createElement("div", "apex-ui-section-status", "Online");
        modHeader.appendChild(modTitle);
        modHeader.appendChild(modStatus);

        const modList = createElement("div", "apex-ui-toggle-list");

        function makeToggle(label, sub, id, initialOn) {
            const row = createElement("div", "apex-ui-toggle");
            row.dataset.on = initialOn ? "true" : "false";
            row.id = id;

            const left = createElement("div");
            const l1 = createElement("div", "apex-ui-toggle-label", label);
            const l2 = createElement("div", "apex-ui-toggle-sub", sub);
            left.appendChild(l1);
            left.appendChild(l2);

            const switchEl = createElement("div", "apex-ui-toggle-switch");
            const knob = createElement("div", "apex-ui-toggle-knob");
            switchEl.appendChild(knob);

            row.appendChild(left);
            row.appendChild(switchEl);

            row.addEventListener("click", () => {
                const current = row.dataset.on === "true";
                row.dataset.on = current ? "false" : "true";
                // For now, visual only — hooks can be wired into modules later
            });

            return row;
        }

        modList.appendChild(
            makeToggle("Renderer", "HALO visual layer", "apex-ui-toggle-renderer", true)
        );
        modList.appendChild(
            makeToggle("Overlay", "HUD + status text", "apex-ui-toggle-overlay", true)
        );
        modList.appendChild(
            makeToggle("Formation AI", "Classic HALO behavior", "apex-ui-toggle-ai", true)
        );
        modList.appendChild(
            makeToggle("Auto-Spawn", "Initial crew deployment", "apex-ui-toggle-spawn", true)
        );

        modSection.appendChild(modHeader);
        modSection.appendChild(modList);

        // Future section: Simulation / APEXSIM hook
        const simSection = createElement("div", "apex-ui-section");
        const simHeader = createElement("div", "apex-ui-section-header");
        const simTitle = createElement("div", "apex-ui-section-title", "Simulation Layer");
        const simStatus = createElement("div", "apex-ui-section-status", "Reserved");
        simHeader.appendChild(simTitle);
        simHeader.appendChild(simStatus);

        const simBody = createElement(
            "div",
            "apex-ui-toggle-sub",
            "Slot reserved for APEXSIM controls, motion fields, and advanced tools."
        );
        simSection.appendChild(simHeader);
        simSection.appendChild(simBody);

        // Assemble body
        body.appendChild(diagSection);
        body.appendChild(modSection);
        body.appendChild(simSection);

        // Footer
        const footer = createElement("div", "apex-ui-footer");
        const tag = createElement("div", "apex-ui-footer-tag", "VECTORCORE // APEXCORE");
        const build = createElement("div", "apex-ui-footer-build", "Build v4.4 — HALO Baseline");
        footer.appendChild(tag);
        footer.appendChild(build);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);

        root.appendChild(panel);
    }

    function hookDiagnostics() {
        const fpsEl = document.getElementById("apex-ui-fps");
        const entsEl = document.getElementById("apex-ui-entities");
        const formsEl = document.getElementById("apex-ui-formations");
        const deltaEl = document.getElementById("apex-ui-delta");

        if (!fpsEl || !entsEl || !formsEl || !deltaEl) return;

        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 0;

        function updateDiagnostics() {
            const now = performance.now();
            frameCount++;
            const diff = now - lastTime;

            if (diff >= 1000) {
                fps = Math.round((frameCount * 1000) / diff);
                frameCount = 0;
                lastTime = now;
            }

            const entities = APEX.get("entities");
            const formations = APEX.get("formations");
            const engine = APEX.get("engine");

            const entsCount =
                entities && typeof entities.all === "function"
                    ? entities.all().length
                    : 0;
            const formsCount =
                formations && typeof formations.all === "function"
                    ? formations.all().length
                    : 0;

            const delta = engine && typeof engine.getDelta === "function"
                ? engine.getDelta()
                : null;

            fpsEl.textContent = fps > 0 ? fps + " fps" : "-- fps";
            entsEl.textContent = String(entsCount);
            formsEl.textContent = String(formsCount);
            deltaEl.textContent = delta != null ? delta.toFixed(2) + " ms" : "-- ms";

            requestAnimationFrame(updateDiagnostics);
        }

        requestAnimationFrame(updateDiagnostics);
    }

    function start() {
        const root = document.getElementById("apex-ui-root");
        if (!root) {
            console.warn("APEXCORE v4.4 UI Deck — root element #apex-ui-root not found.");
            return;
        }

        buildPanel(root);
        hookDiagnostics();

        console.log("APEXCORE v4.4 — UI Deck initialized");
    }

    APEX.register("apex-ui", {
        type: "ui",
        start
    });

})();
