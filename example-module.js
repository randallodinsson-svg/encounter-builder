// Example module — simple, stable, APEXCORE v3.5 compatible

export const ExampleModule = {
    name: "example",

    init(core) {
        console.log("ExampleModule.init() called.");
        core.set("example.status", "initialized");
        core.set("example.ticks", 0);
    },

    tick(tickData, core) {
        const count = (core.get("example.ticks") || 0) + 1;
        core.set("example.ticks", count);
        core.set("example.lastTickTime", tickData.time);
        core.set("example.random", tickData.random);
        core.set("example.status", `running (${count} ticks)`);
    },

    destroy(core) {
        console.log("ExampleModule.destroy() called.");
        core.delete("example.status");
        core.delete("example.ticks");
        core.delete("example.lastTickTime");
        core.delete("example.random");
    },

    reload(core) {
        console.log("ExampleModule.reload() called.");
        core.set("example.status", "reloaded");
    }
};
