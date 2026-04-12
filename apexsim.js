// APEXSIM — simple simulation listener

export const APEXSIM = (() => {
    let core = null;
    let ui = null;
    let lastTick = 0;

    function init(coreRef, uiRefs) {
        core = coreRef;
        ui = uiRefs;
        core.onTick(onTick);
        refresh();
    }

    function onTick(tickData) {
        lastTick = tickData.count;
        refresh();
    }

    function refresh() {
        if (!ui || !ui.statusEl) return;
        ui.statusEl.textContent =
            `SIM online.\nLast tick: ${lastTick || "none yet"}`;
    }

    return {
        init,
        refresh
    };
})();
