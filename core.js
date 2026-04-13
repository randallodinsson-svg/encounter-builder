/*
    APEXCORE v4.2 — Core Module System (FULLNUKE Edition)
    Provides registration, lookup, and lifecycle management for all modules.
*/

window.APEX = (function () {

    const modules = {};

    return {

        // Register a module by name
        register(name, module) {
            if (!name || typeof name !== "string") {
                console.error("APEXCORE — Invalid module name:", name);
                return;
            }

            modules[name] = module;
            console.log(`APEXCORE v4.2 — Module registered: ${name}`);
        },

        // Retrieve a module by name
        get(name) {
            return modules[name] || null;
        },

        // Retrieve all modules
        all() {
            return modules;
        },

        // Start all modules that have a .start() function
        startAll() {
            console.log("APEXCORE v4.2 — Starting all modules...");

            for (const key in modules) {
                const m = modules[key];
                if (typeof m.start === "function") {
                    console.log(`APEXCORE v4.2 — Starting module: ${key}`);
                    try {
                        m.start();
                    } catch (err) {
                        console.error(`APEXCORE v4.2 — Error starting module: ${key}`, err);
                    }
                }
            }
        }
    };

})();
