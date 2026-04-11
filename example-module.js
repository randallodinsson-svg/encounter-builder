// example-module.js
// A tiny, clean APEXCORE module to light up diagnostics.

export const ExampleModule = {

    name: "example",
    counter: 0,

    init(core) {
        core.log("ExampleModule.init() called.");

        this.counter = 0;

        core.set("example.status", {
            initialized: true,
            value: this.counter,
            note: "Example module mounted."
        });
    },

    destroy(core) {
        core.log("ExampleModule.destroy() called.");
        core.delete("example.status");
    },

    reload(core) {
        core.log("ExampleModule.reload() called.");

        this.counter = 0;

        core.set("example.status", {
            initialized: true,
            value: this.counter,
            note: "Example module reloaded."
        });
    },

    tick(tick, core) {
        this.counter++;

        core.set("example.status", {
            initialized: true,
            value: this.counter,
            note: "Tick updated value."
        });
    }
};
