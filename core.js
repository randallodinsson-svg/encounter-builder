/*
    APEXCORE v4.2 — Core Loop & Module Registry
    Last-known-good style: minimal, deterministic, renderer-agnostic.
*/

/* -------------------------------------------------------
   MODULE REGISTRY
------------------------------------------------------- */
const APEX = {
    modules: {},
    register(name, module) {
        this.modules[name] = module;
    },
    get(name) {
        return this.modules[name];
    }
};

/* -------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------- */
const STATE = {
    lastTick: performance.now(),
    delta: 0,
    time: 0
};

/* -------------------------------------------------------
   MAIN TICK LOOP
------------------------------------------------------- */
function tick(now) {
    STATE.delta = now - STATE.lastTick;
    STATE.lastTick = now;
    STATE.time += STATE.delta;

    for (const key in APEX.modules) {
        const mod = APEX.modules[key];
        if (mod && typeof mod.update === "function") {
            mod.update(STATE);
        }
    }

    requestAnimationFrame(tick);
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
function initCore() {
    console.log("APEXCORE v4.2 — Core Loop Online");
    requestAnimationFrame(tick);
}

initCore();
