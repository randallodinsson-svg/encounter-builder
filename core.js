/*
    APEXCORE v4.4 — Core Module Registry (Stable HALO Crew)
*/

(function () {

    const modules = {};

    function register(name, mod) {
        modules[name] = mod;
        console.log(`APEXCORE v4.4 — Module registered: ${name}`);
    }

    function get(name) {
        return modules[name] || null;
    }

    function all() {
        return modules;
    }

    function startAll() {
        console.log("APEXCORE v4.4 — Starting all modules...");
        for (const key in modules) {
            const m = modules[key];
            if (m && typeof m.start === "function") {
                console.log(`APEXCORE v4.4 — Starting module: ${key}`);
                m.start();
            }
        }
    }

    window.APEX = { register, get, all, startAll };

})();
