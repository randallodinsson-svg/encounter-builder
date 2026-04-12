// EVENT-TIMELINE-VISUALIZER — Per-tick engine heartbeat timeline

export const EventTimelineVisualizer = {
    meta: {
        name: "event-timeline-visualizer",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Maintains a rolling timeline of tick events and key metrics.",
        namespace: "timeline",
        capabilities: ["ops", "introspection"]
    },

    init(core, ctx) {
        const ns = ctx.meta.namespace;
        ctx.state.events = [];
        core.set(`${ns}.status`, "initialized");
        core.set(`${ns}.events`, []);
        core.set(`${ns}.lastUpdate`, null);
    },

    tick(tickData, core, ctx) {
        const ns = ctx.meta.namespace;
        const events = ctx.state.events;

        const duration = core.get("profiler.lastTickDuration") ?? null;
        const diff = core.get("regdiff.diff") ?? null;

        const changedCount = diff && diff.changed
            ? Object.keys(diff.changed).length
            : 0;
        const addedCount = diff && diff.added
            ? Object.keys(diff.added).length
            : 0;
        const removedCount = diff && diff.removed
            ? Object.keys(diff.removed).length
            : 0;

        const entry = {
            tick: tickData.count ?? null,
            time: tickData.time ?? null,
            durationMs: duration,
            registry: {
                added: addedCount,
                removed: removedCount,
                changed: changedCount
            }
        };

        events.push(entry);
        if (events.length > 100) {
            events.shift();
        }

        core.set(`${ns}.events`, events);
        core.set(`${ns}.lastUpdate`, tickData.time);
        core.set(`${ns}.status`, "updated");
    },

    destroy(core, ctx) {
        const ns = ctx.meta.namespace;
        core.delete(`${ns}.status`);
        core.delete(`${ns}.events`);
        core.delete(`${ns}.lastUpdate`);
        ctx.state.events = [];
    },

    reload(core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "reloaded");
    }
};
