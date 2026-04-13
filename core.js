/*
    APEXCORE v4.2 — Core Module Registry (B1-A Clean Tactical Sim)
*/

(function () {

    const modules = {};

    function register(name, mod) {
        modules[name] = mod;
        console.log(`APEXCORE v4.2 — Module registered: ${name}`);
    }

    function get(name) {
        return modules[name] || null;
    }

    function all() {
        return modules;
    }

    function startAll() {
            console.log("APEXCORE v4.2 — Starting all modules...");
            for (const key in modules) {
                const m = modules[key];
                if (m && typeof m.start === "function") {
                    console.log(`APEXCORE v4.2 — Starting module: ${key}`);
                    m.start();
                }
            }
    }

    window.APEX = { register, get, all, startAll };

})();
