// APEXCORE v3.5 — minimal, stable core

export const APEXCORE = (() => {
    const registry = new Map();
    const modules = new Map();
    const mounted = new Set();
    const tickListeners = new Set();

    function log(...args) {
        console.log("[APEXCORE]", ...args);
    }

    function init() {
        log("init()");
    }

    function set(key, value) {
        registry.set(key, value);
    }

    function get(key) {
        return registry.get(key);
    }

    function del(key) {
        registry.delete(key);
    }

    function register(name, mod) {
        if (modules.has(name)) {
            log("register() skipped — already registered:", name);
            return;
        }
        modules.set(name, mod);
        log("Module registered:", name);
    }

    function mount(name) {
        if (!modules.has(name)) {
            log("mount() failed — unknown module:", name);
            return;
        }
        if (mounted.has(name)) {
            log("mount() skipped — already mounted:", name);
            return;
        }
        const mod = modules.get(name);
        if (typeof mod.init === "function") {
            mod.init(api);
        }
        mounted.add(name);
        log("Module mounted:", name);
    }

    function unmount(name) {
        if (!mounted.has(name)) {
            log("unmount() skipped — not mounted:", name);
            return;
        }
        const mod = modules.get(name);
        if (mod && typeof mod.destroy === "function") {
            mod.destroy(api);
        }
        mounted.delete(name);
        log("Module unmounted:", name);
    }

    function reload(name) {
        const mod = modules.get(name);
        if (!mod) {
            log("reload() failed — unknown module:", name);
            return;
        }
        if (typeof mod.reload === "function") {
            mod.reload(api);
            log("Module reloaded:", name);
        } else {
            log("reload() skipped — no reload() on module:", name);
        }
    }

    function runTick(tickData) {
        for (const name of mounted) {
            const mod = modules.get(name);
            if (mod && typeof mod.tick === "function") {
                try {
                    mod.tick(tickData, api);
                } catch (err) {
                    console.error("[APEXCORE] tick error in module:", name, err);
                }
            }
        }
        for (const cb of tickListeners) {
            try {
                cb(tickData);
            } catch (err) {
                console.error("[APEXCORE] tick listener error:", err);
            }
        }
    }

    function onTick(cb) {
        tickListeners.add(cb);
    }

    function offTick(cb) {
        tickListeners.delete(cb);
    }

    function debugSnapshot() {
        return {
            registry: Object.fromEntries(registry.entries()),
            modules: Array.from(modules.keys()),
            mounted: Array.from(mounted.values())
        };
    }

    const api = {
        init,
        set,
        get,
        delete: del,
        register,
        mount,
        unmount,
        reload,
        runTick,
        onTick,
        offTick,
        debugSnapshot
    };

    return api;
})();
