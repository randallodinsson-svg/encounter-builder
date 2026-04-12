// APEXOPS — diagnostics + controls

export const APEXOPS = (() => {
    let core = null;
    let engine = null;
    let ui = null;

    function log(msg) {
        if (!ui || !ui.logEl) return;
        ui.logEl.textContent += "\n" + msg;
        ui.logEl.scrollTop = ui.logEl.scrollHeight;
    }

    function refreshRegistry() {
        if (!ui || !ui.registryEl || !core) return;
        ui.registryEl.textContent = JSON.stringify(core.debugSnapshot().registry, null, 2);
    }

    function refreshModules() {
        if (!ui || !ui.modulesEl || !core) return;
        const snap = core.debugSnapshot();
        ui.modulesEl.textContent =
            "Modules:\n" + snap.modules.join(", ") +
            "\n\nMounted:\n" + snap.mounted.join(", ");
    }

    function refreshViews() {
        refreshRegistry();
        refreshModules();
    }

    function wireButtons() {
        const {
            runTickBtn,
            startAutoBtn,
            stopAutoBtn,
            autoInterval,
            autoIntervalLabel
        } = ui;

        runTickBtn.addEventListener("click", () => {
            engine.runSingleTick();
            log("[OPS] Manual tick executed.");
            refreshViews();
        });

        startAutoBtn.addEventListener("click", () => {
            engine.start();
            startAutoBtn.disabled = true;
            stopAutoBtn.disabled = false;
            log("[OPS] Auto‑tick started.");
        });

        stopAutoBtn.addEventListener("click", () => {
            engine.stop();
            startAutoBtn.disabled = false;
            stopAutoBtn.disabled = true;
            log("[OPS] Auto‑tick stopped.");
        });

        autoInterval.addEventListener("input", () => {
            const ms = Number(autoInterval.value);
            autoIntervalLabel.textContent = ms;
            engine.setIntervalMs(ms);
        });
    }

    function init(coreRef, engineRef, uiRefs) {
        core = coreRef;
        engine = engineRef;
        ui = uiRefs;
        log("[OPS] Initialized.");
        wireButtons();
        refreshViews();
    }

    return {
        init,
        refreshViews
    };
})();
