// Example module — APEXCORE Module API v1.0 compatible

export const ExampleModule = {
    meta: {
        name: "example",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Baseline diagnostics/example module for APEXCORE v3.5.",
        namespace: "example",
        capabilities: ["tick", "registry"]
    },

    init(core, ctx) {
        console.log("ExampleModule.init() called.", ctx);
        const ns = ctx.meta.namespace || ctx.name;

        core.set(`${ns}.status`, "initialized");
        core.set(`${ns}.ticks`, 0);
    },

    tick(tickData, core, ctx) {
        const ns = ctx.meta.namespace || ctx.name;

        const count = (core.get(`${ns}.ticks`) || 0) + 1;
        core.set(`${ns}.ticks`, count);
        core.set(`${ns}.lastTickTime`, tickData.time);
        core.set(`${ns}.random`, tickData.random);
        core.set(`${ns}.status`, `running (${count} ticks)`);
    },

    destroy(core, ctx) {
        console.log("ExampleModule.destroy() called.", ctx);
        const ns = ctx.meta.namespace || ctx.name;

        core.delete(`${ns}.status`);
        core.delete(`${ns}.ticks`);
        core.delete(`${ns}.lastTickTime`);
        core.delete(`${ns}.random`);
    },

    reload(core, ctx) {
        console.log("ExampleModule.reload() called.", ctx);
        const ns = ctx.meta.namespace || ctx.name;

        core.set(`${ns}.status`, "reloaded");
    }
};
