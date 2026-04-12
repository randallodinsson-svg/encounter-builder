// MODULE-INSPECTOR — APEXCORE Module API v1.0 Introspection Module

export const ModuleInspector = {
    meta: {
        name: "module-inspector",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Provides live introspection of all registered modules.",
        namespace: "modinspector",
        capabilities: ["introspection", "ops"]
    },

    init(core, ctx) {
        console.log("ModuleInspector.init()", ctx);
        core.set(`${ctx.meta.namespace}.status`, "initialized");
    },

    tick(tickData, core, ctx) {
        // Build a live snapshot of all modules
        const snapshot = {};
        const all = core.listModules();

        for (const name of all) {
            const info = core.getModuleInfo(name);
            snapshot[name] = {
                meta: info.meta,
                mounted: info.mounted,
                hooks: {
                    init: info.hasInit,
                    tick: info.hasTick,
                    destroy: info.hasDestroy,
                    reload: info.hasReload
                }
            };
        }

        core.set(`${ctx.meta.namespace}.modules`, snapshot);
        core.set(`${ctx.meta.namespace}.lastUpdate`, tickData.time);
    },

    destroy(core, ctx) {
        console.log("ModuleInspector.destroy()", ctx);
        const ns = ctx.meta.namespace;
        core.delete(`${ns}.status`);
        core.delete(`${ns}.modules`);
        core.delete(`${ns}.lastUpdate`);
    },

    reload(core, ctx) {
        console.log("ModuleInspector.reload()", ctx);
        core.set(`${ctx.meta.namespace}.status`, "reloaded");
    }
};
