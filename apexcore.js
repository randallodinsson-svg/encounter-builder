// APEXCORE v3.6 — Core + Module API v1.0 + Per‑Module Tick Instrumentation

export const APEXCORE = (() => {
    const registry = new Map();
    const modules = new Map();
    const tickListeners = new Set();

    function log(...args) {
        console.log("[APEXCORE]", ...args);
    }

    // -----------------------------
    // Registry API
    // -----------------------------
    function set(key, value) { registry.set(key, value); }
    function get(key) { return registry.get(key); }
    function del(key) { registry.delete(key); }

    // -----------------------------
    // Module API v1.0
    // -----------------------------
    function register(nameOrModule, maybeModule) {
        let def, meta = {}, name;

        if (typeof nameOrModule === "string") {
            name = nameOrModule;
            def = maybeModule;
            meta = def.meta || {};
            if (!meta.name) meta.name = name;
        } else {
            def = nameOrModule;
            meta = def.meta || {};
            name = meta.name || def.name;
            if (!name) {
                log("register() failed — module missing name");
                return;
            }
            if (!meta.name) meta.name = name;
        }

        if (modules.has(name)) {
            log("register() skipped — already registered:", name);
            return;
        }

        modules.set(name, {
            def,
            meta,
            state: {},
            mounted: false,
            perf: { count: 0, total: 0, min: null, max: null, last: null }
        });

        log("Module registered:", name);
    }

    function mount(name) {
        const record = modules.get(name);
        if (!record) return log("mount() failed — unknown:", name);
        if (record.mounted) return;

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.init === "function") {
            try { def.init(api, ctx); }
            catch (err) { console.error("[APEXCORE] init error:", name, err); }
        }

        record.mounted = true;
        log("Module mounted:", name);
    }

    function unmount(name) {
        const record = modules.get(name);
        if (!record || !record.mounted) return;

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.destroy === "function") {
            try { def.destroy(api, ctx); }
            catch (err) { console.error("[APEXCORE] destroy error:", name, err); }
        }

        record.mounted = false;
        log("Module unmounted:", name);
    }

    function reload(name) {
        const record = modules.get(name);
        if (!record) return;

        const { def, meta, state } = record;
        const ctx = { name, meta, state };

        if (typeof def.reload === "function") {
            try { def.reload(api, ctx); }
            catch (err) { console.error("[APEXCORE] reload error:", name, err); }
        }
    }

    function listModules() { return [...modules.keys()]; }
    function listMountedModules() { return [...modules.entries()].filter(([_, r]) => r.mounted).map(([n]) => n); }

    function getModuleInfo(name) {
        const r = modules.get(name);
        if (!r) return null;
        return {
            name,
            meta: r.meta,
            mounted: r.mounted,
            perf: r.perf,
            hasInit: typeof r.def.init === "function",
            hasTick: typeof r.def.tick === "function",
            hasDestroy: typeof r.def.destroy === "function",
            hasReload: typeof r.def.reload === "function"
        };
    }
    // -----------------------------
    // Tick pipeline (instrumented)
    // -----------------------------
    function runTick(tickData) {
        for (const [name, record] of modules.entries()) {
            if (!record.mounted) continue;
            const { def, meta, state, perf } = record;

            if (typeof def.tick === "function") {
                const ctx = { name, meta, state };

                const start = performance.now();
                try { def.tick(tickData, api, ctx); }
                catch (err) { console.error("[APEXCORE] tick error:", name, err); }
                const end = performance.now();

                const duration = end - start;
                perf.last = duration;
                perf.count += 1;
                perf.total += duration;
                perf.min = perf.min === null ? duration : Math.min(perf.min, duration);
                perf.max = perf.max === null ? duration : Math.max(perf.max, duration);

                // Write to registry for PerModuleProfiler
                const ns = `modprofiler.${name}`;
                set(`${ns}.lastMs`, duration);
                set(`${ns}.minMs`, perf.min);
                set(`${ns}.maxMs`, perf.max);
                set(`${ns}.avgMs`, perf.total / perf.count);
                set(`${ns}.ticks`, perf.count);
            }
        }

        for (const cb of tickListeners) {
            try { cb(tickData); }
            catch (err) { console.error("[APEXCORE] tick listener error:", err); }
        }
    }

    function onTick(cb) { tickListeners.add(cb); }
    function offTick(cb) { tickListeners.delete(cb); }

    // -----------------------------
    // Debug snapshot
    // -----------------------------
    function debugSnapshot() {
        return {
            registry: Object.fromEntries(registry.entries()),
            modules: listModules(),
            mounted: listMountedModules()
        };
    }

    // -----------------------------
    // ⭐ NEW: Full snapshot for APEXOPS
    // -----------------------------
    function getSnapshot() {
        return Object.fromEntries(registry.entries());
    }
    const api = {
        init: () => log("init()"),
        set, get, delete: del,
        register, mount, unmount, reload,
        listModules, listMountedModules, getModuleInfo,
        runTick, onTick, offTick,
        debugSnapshot,
        getSnapshot   // ⭐ REQUIRED FOR APEXOPS
    };

    return api;
})();
