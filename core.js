/*
    APEXCORE v4.2 — Core Module Registry
    Handles module registration, retrieval, and startup sequencing.
*/

(function () {

    const modules = {};

    const APEX = {
        register(name, module) {
            modules[name] = module;
            console.log(`APEXCORE v4.2 — Module registered: ${name}`);
        },

        get(name) {
            return modules[name];
        },

        all() {
            return modules;
        },

        // NEW: Start all modules that define a .start() method
        startAll() {
            console.log("APEXCORE v4.2 — Starting all modules...");
            for (const key in modules) {
                const m = modules[key];
                if (typeof m.start === "function") {
                    console.log(`APEXCORE v4.2 — Starting module: ${key}`);
                    m.start();
                }
            }
        }
    };

    // Expose globally
    window.APEX = APEX;

})();
