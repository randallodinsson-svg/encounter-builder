// APEXCORE v3.5 — Core + Module API v1.0

export const APEXCORE = (() => {
    // Internal stores
    const registry = new Map();
    const modules = new Map(); // name -> { def, meta, state, mounted }
    const tickListeners = new Set();

    function log(...args) {
        console.log("[APEXCORE]", ...args);
    }

    // -----------------------------
    // Registry API
    // -----------------------------
    function set(key, value) {
        registry.set(key, value);
    }

    function get(key) {
        return registry.get(key);
    }

    function del(key) {
        registry.delete(key);
    }

    // -----------------------------
    // Module API v1.0
    // -----------------------------
    /**
     * register(name, moduleDef)
     * register(moduleDef) // uses moduleDef.meta.name or moduleDef.name
     */
    function register(nameOrModule, maybeModule) {
        let def;
        let meta = {};
        let name;

        if (typeof nameOrModule === "string") {
            name = nameOrModule;
            def = maybeModule;
            if (!def || typeof def !== "object") {
                log("register() failed — invalid module for name:", name);
                return;
            }
            meta = def.meta || {};
            if (!meta.name) meta.name = name;
        } else {
            def = nameOrModule;
            if (!def || typeof def !== "object") {
                log("register() failed — invalid module object");
                return;
            }
            meta = def.meta || {};
            name = meta.name || def.name;
            if (!name) {
                log("register() failed — module missing meta.name or export name");
                return;
            }
            if (!meta.name) meta.name = name;
        }

        if (modules.has(name)) {
            log("register() skipped — already registered:", name);
            return;
        }

        const record = {
            def,
            meta,
            state: {},   // per‑module mutable state bag
            mounted: false
        };

        modules.set(name, record);
        log("Module registered:", name);
    }

    function mount(name) {
        const record = modules.get(name);
        if (!record) {
            log("mount() failed — unknown module:", name);
            return;
        }
        if (record.mounted) {
            log("mount() skipped — already mounted:", name);
            return;
        }

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.init === "function") {
            try {
                def.init(api, ctx);
            } catch (err) {
                console.error("[APEXCORE] init() error in module:", name, err);
            }
        }

        record.mounted = true;
        log("Module mounted:", name);
    }

    function unmount(name) {
        const record = modules.get(name);
        if (!record) {
            log("unmount() failed — unknown module:", name);
            return;
        }
        if (!record.mounted) {
            log("unmount() skipped — not mounted:", name);
            return;
        }

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.destroy === "function") {
            try {
                def.destroy(api, ctx);
            } catch (err) {
                console.error("[APEXCORE] destroy() error in module:", name, err);
            }
        }

        record.mounted = false;
        log("Module unmounted:", name);
    }

    function reload(name) {
        const record = modules.get(name);
        if (!record) {
            log("reload() failed — unknown module:", name);
            return;
        }

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.reload === "function") {
            try {
                def.reload(api, ctx);
                log("Module reloaded:", name);
            } catch (err) {
                console.error("[APEXCORE] reload() error in module:", name, err);
            }
        } else {
            log("reload() skipped — no reload() on module:", name);
        }
    }

    function listModules() {
        return Array.from(modules.keys());
    }

    function listMountedModules() {
        return Array.from(modules.entries())
            .filter(([, rec]) => rec.mounted)
            .map(([name]) => name);
    }

    function getModuleInfo(name) {
        const record = modules.get(name);
        if (!record) return null;
        const { meta, mounted, def } = record;
        return {
            name,
            meta,
            mounted,
            hasInit: typeof def.init === "function",
            hasTick: typeof def.tick === "function",
            hasDestroy: typeof def.destroy === "function",
            hasReload: typeof def.reload === "function"
        };
    }

    // -----------------------------
    // Tick pipeline
    // -----------------------------
    function runTick(tickData) {
        // Modules
        for (const [name, record] of modules.entries()) {
            if (!record.mounted) continue;
            const { def, meta, state } = record;
            if (typeof def.tick === "function") {
                const ctx = { name, meta, state };
                try {
                    def.tick(tickData, api, ctx);
                } catch (err) {
                    console.error("[APEXCORE] tick error in module:", name, err);
                }
            }
        }

        // Listeners
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

    // -----------------------------
    // Debug / snapshot
    // -----------------------------
    function debugSnapshot() {
        const regObj = Object.fromEntries(registry.entries());
        const moduleInfos = {};
        for (const [name, record] of modules.entries()) {
            moduleInfos[name] = {
                meta: record.meta,
                mounted: record.mounted
            };
        }
        return {
            registry: regObj,
            modules: Object.keys(moduleInfos),
            mounted: listMountedModules(),
            moduleInfo: moduleInfos
        };
    }

    // -----------------------------
    // Init
    // -----------------------------
    function init() {
        log("init()");
    }

    const api = {
        // lifecycle
        init,

        // registry
        set,
        get,
        delete: del,

        // modules
        register,
        mount,
        unmount,
        reload,
        listModules,
        listMountedModules,
        getModuleInfo,

        // ticks
        runTick,
        onTick,
        offTick,

        // debug
        debugSnapshot
    };

    return api;
})();
