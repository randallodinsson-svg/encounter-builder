// REGISTRY-DIFF-VIEWER — Per-tick registry change introspection

export const RegistryDiffViewer = {
    meta: {
        name: "registry-diff-viewer",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Shows per-tick registry diffs (added, removed, changed keys).",
        namespace: "regdiff",
        capabilities: ["introspection", "ops"]
    },

    init(core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "initialized");
        core.set(`${ns}.diff`, {
            added: {},
            removed: {},
            changed: {}
        });
        core.set(`${ns}.lastUpdate`, null);
        ctx.state.prev = null;
    },

    tick(tickData, core, ctx) {
        const ns = ctx.meta.namespace;

        // Get current registry snapshot from APEXCORE
        const snapshot = core.debugSnapshot();
        const current = snapshot.registry || {};
        const prev = ctx.state.prev || {};

        const added = {};
        const removed = {};
        const changed = {};

        // Detect added + changed
        for (const key of Object.keys(current)) {
            if (!(key in prev)) {
                added[key] = current[key];
            } else if (prev[key] !== current[key]) {
                changed[key] = {
                    before: prev[key],
                    after: current[key]
                };
            }
        }

        // Detect removed
        for (const key of Object.keys(prev)) {
            if (!(key in current)) {
                removed[key] = prev[key];
            }
        }

        const diff = { added, removed, changed };

        core.set(`${ns}.diff`, diff);
        core.set(`${ns}.lastUpdate`, tickData.time);
        core.set(`${ns}.status`, "updated");

        // Store current snapshot for next tick
        ctx.state.prev = current;
    },

    destroy(core, ctx) {
        const ns = ctx.meta.namespace;
        core.delete(`${ns}.status`);
        core.delete(`${ns}.diff`);
        core.delete(`${ns}.lastUpdate`);
        ctx.state.prev = null;
    },

    reload(core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "reloaded");
    }
};
