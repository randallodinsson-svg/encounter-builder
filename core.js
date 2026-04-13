/* 
    APEXCORE v4.2 — Core Skeleton
    Clean, stable, last-known-good foundation.
*/

/* -------------------------------------------------------
   MODULE REGISTRY (empty but wired)
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
   GLOBAL STATE (minimal)
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

    // Dispatch tick to all registered modules
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
function init() {
    console.log("APEXCORE v4.2 — Core Skeleton Loaded");
    requestAnimationFrame(tick);
}

init();
