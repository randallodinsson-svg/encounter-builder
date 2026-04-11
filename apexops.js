/* ============================================================
   APEXOPS — Modern Diagnostics Engine (Option B)
   Clean, modular, future‑proof, profiler‑ready
============================================================ */

export const APEXOPS = (() => {

    /* ============================================================
       INTERNAL STATE
    ============================================================ */

    let CORE = null;

    const coreLogs = [];
    const coreErrors = [];
    const lifecycleHistory = [];

    const registryKeys = [];
    const registryValues = {};

    /* ============================================================
       LOGGING + ERROR CAPTURE
    ============================================================ */

    function hookConsole() {
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            coreLogs.push(args.join(" "));
            originalLog(...args);
        };

        console.error = (...args) => {
            coreErrors.push({
                timestamp: Date.now(),
                context: "console.error",
                error: args.join(" ")
            });
            originalError(...args);
        };
    }

    /* ============================================================
       LIFECYCLE TRACKING
    ============================================================ */

    function trackLifecycle(type, name) {
        lifecycleHistory.push({
            timestamp: Date.now(),
            type,
            name
        });
    }

    /* ============================================================
       REGISTRY TRACKING
    ============================================================ */

    function captureRegistrySnapshot() {
        if (!CORE || !CORE.registry) return;

        registryKeys.length = 0;
        registryKeys.push(...Object.keys(CORE.registry));

        for (const key of registryKeys) {
            registryValues[key] = CORE.registry[key];
        }
    }

    /* ============================================================
       MODULE STATUS
    ============================================================ */

    function getModuleStatus() {
        if (!CORE) return {};

        const out = {};
        const mounted = CORE.getMountedModules
            ? CORE.getMountedModules()
            : Object.keys(CORE.modules || {});

        for (const name of mounted) {
            out[name] = {
                mounted: true,
                hasTick: typeof CORE.getModule(name)?.tick === "function"
            };
        }

        return out;
    }

    /* ============================================================
       RUNTIME INSPECTION
    ============================================================ */

    function inspectRuntime(tick) {
        return {
            tick,
            mountedModules: CORE.getMountedModules
                ? CORE.getMountedModules()
                : Object.keys(CORE.modules || {}),
            registry: { ...registryValues }
        };
    }

    /* ============================================================
       PUBLIC API
    ============================================================ */

    function init(core) {
        CORE = core;
        hookConsole();
        captureRegistrySnapshot();
    }

    function attachEventHooks() {
        if (!CORE) return;

        const originalMount = CORE.mount;
        const originalUnmount = CORE.unmount;
        const originalReload = CORE.reload;

        CORE.mount = (name) => {
            trackLifecycle("mount", name);
            return originalMount.call(CORE, name);
        };

        CORE.unmount = (name) => {
            trackLifecycle("unmount", name);
            return originalUnmount.call(CORE, name);
        };

        CORE.reload = (name) => {
            trackLifecycle("reload", name);
            return originalReload.call(CORE, name);
        };
    }

    function getCoreLogs() {
        return coreLogs;
    }

    function getCoreErrors() {
        return coreErrors;
    }

    function getLifecycleHistory() {
        return lifecycleHistory;
    }

    function getRegistryKeys() {
        return registryKeys;
    }

    function getRegistryValues() {
        return registryValues;
    }

    function getCoreSnapshot() {
        return {
            mountedModules: CORE.getMountedModules
                ? CORE.getMountedModules()
                : Object.keys(CORE.modules || {}),
            registry: { ...registryValues },
            eventNames: CORE.eventNames || []
        };
    }

    return {
        init,
        attachEventHooks,
        inspectRuntime,
        getCoreLogs,
        getCoreErrors,
        getLifecycleHistory,
        getModuleStatus,
        getRegistryKeys,
        getRegistryValues,
        getCoreSnapshot
    };

})();
