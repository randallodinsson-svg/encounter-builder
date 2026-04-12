// ============================================================
// Example Module — Clean, Stable, APEXCORE v3.5 Compatible
// ============================================================

export const ExampleModule = {

    name: "example",

    // Called when module is mounted
    init(core) {
        console.log("ExampleModule.init() called.");
        core.set("example.status", "initialized");
    },

    // Called every tick
    tick(tickData, core) {
        // Update registry safely
        core.set("example.status", `tick @ ${tickData.time}`);

        // Optional: store random value
        core.set("example.random", tickData.random);
    },

    // Called when module is unmounted
    destroy(core) {
        console.log("ExampleModule.destroy() called.");
        core.delete("example.status");
        core.delete("example.random");
    },

    // Optional reload hook
    reload(core) {
        console.log("ExampleModule.reload() called.");
        core.set("example.status", "reloaded");
    }
};
