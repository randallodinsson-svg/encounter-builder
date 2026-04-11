// example-module.js
// A tiny, clean APEXCORE module to light up diagnostics.

export const ExampleModule = {

    name: "example",

    init(core) {
        core.log("ExampleModule.init() called.");

        // Write something into the registry so the Registry panel lights up.
        core.set("example.status", {
            initialized: true,
            value: 1,
            note: "Example module mounted."
        });
    },

    destroy(core) {
        core.log("ExampleModule.destroy() called.");

        // Clean up registry so unmount is visible.
        core.delete("example.status");
    },

    reload(core) {
        core.log("ExampleModule.reload() called.");

        // Change the registry value so reload is visible.
        core.set("example.status", {
            initialized: true,
            value: 2,
            note: "Example module reloaded."
        });
    }
};
