// TICK-PROFILER — Global tick duration metrics for APEXCORE

export const TickProfiler = {
    meta: {
        name: "tick-profiler",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Tracks global tick duration statistics.",
        namespace: "profiler",
        capabilities: ["profiling", "ops"]
    },

    init(core, ctx) {
        console.log("TickProfiler.init()", ctx);
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "initialized");
        core.set(`${ns}.ticks`, 0);
        core.set(`${ns}.minMs`, null);
        core.set(`${ns}.maxMs`, null);
        core.set(`${ns}.avgMs`, null);
        core.set(`${ns}.lastMs`, null);
    },

    tick(tickData, core, ctx) {
        const ns = ctx.meta.namespace;
        const last = core.get(`${ns}.lastTickDuration`);

        // ENGINE writes profiler.lastTickDuration after each tick.
        // We read it on the *next* tick and aggregate.
        if (typeof last !== "number") return;

        const state = ctx.state;
        if (!state.count) {
            state.count = 0;
            state.total = 0;
            state.min = null;
            state.max = null;
        }

        state.count += 1;
        state.total += last;
        state.min = state.min === null ? last : Math.min(state.min, last);
        state.max = state.max === null ? last : Math.max(state.max, last);
        const avg = state.total / state.count;

        core.set(`${ns}.ticks`, state.count);
        core.set(`${ns}.minMs`, state.min);
        core.set(`${ns}.maxMs`, state.max);
        core.set(`${ns}.avgMs`, avg);
        core.set(`${ns}.lastMs`, last);
    },

    destroy(core, ctx) {
        console.log("TickProfiler.destroy()", ctx);
        const ns = ctx.meta.namespace;
        core.delete(`${ns}.status`);
        core.delete(`${ns}.ticks`);
        core.delete(`${ns}.minMs`);
        core.delete(`${ns}.maxMs`);
        core.delete(`${ns}.avgMs`);
        core.delete(`${ns}.lastMs`);
        core.delete(`${ns}.lastTickDuration`);
    },

    reload(core, ctx) {
        console.log("TickProfiler.reload()", ctx);
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "reloaded");
    }
};
