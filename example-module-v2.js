// ============================================================
// Example Module — Clean, Stable, APEXCORE v3.5 Compatible
// ============================================================

export const ExampleModule = {

    name: "example",

    init(core) {
        console.log("ExampleModule.init() called.");
        core.set("example.status", "initialized");
    },

    tick(tickData, core) {
        core.set("example.status", `tick @ ${tickData.time}`);
        core.set("example.random", tickData.random);
    },

    destroy(core) {
        console.log("ExampleModule.destroy() called.");
        core.delete("example.status");
        core.delete("example.random");
    },

    reload(core) {
        console.log("ExampleModule.reload() called.");
        core.set("example.status", "reloaded");
    }
};
