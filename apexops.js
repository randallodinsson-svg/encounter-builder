/* ============================================================
   APEXOPS — Modern Diagnostics Engine (Option B, aligned to APEXCORE v3.5)
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
       HELPERS TO READ APEXCORE v3.5
    ============================================================ */

    function getMountedModulesList() {
        if (!CORE || !CORE.state || !CORE.state.moduleStatus) return [];
        return Object.keys(CORE.state.moduleStatus)
            .filter(name => CORE.state.moduleStatus[name] === "mounted");
    }

    function getRegistrySource() {
        if (!CORE || !CORE.state) return {};
        return CORE.state.registry || {};
    }

    function getEventNamesSource() {
        if (!CORE || !CORE.state) return [];
        return Object.keys(CORE.state.events || {});
    }

    function getCoreLogsSource() {
        if (CORE && typeof CORE.getLogs === "function") {
            return CORE.getLogs();
        }
        if (CORE && CORE.state) {
            return CORE.state.logs || [];
        }
        return [];
    }

    function getCoreErrorsSource() {
        if (CORE && typeof CORE.getErrors === "function") {
            return CORE.getErrors();
        }
        if (CORE && CORE.state && CORE.state.diagnostics) {
            return CORE.state.diagnostics.errors || [];
        }
        return [];
    }

    function getLifecycleSource() {
        if (CORE && typeof CORE.getLifecycleHistory === "function") {
            return CORE.getLifecycleHistory();
        }
        if (CORE && CORE.state && CORE.state.diagnostics) {
            return CORE.state.diagnostics.lifecycleHistory || [];
        }
        return [];
    }

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
       LIFECYCLE TRACKING (OPS-SIDE)
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
        const src = getRegistrySource();

        registryKeys.length = 0;
        registryKeys.push(...Object.keys(src));

        for (const key of registryKeys) {
            registryValues[key] = src[key];
        }
    }

    /* ============================================================
       MODULE STATUS
    ============================================================ */

    function getModuleStatus() {
        if (!CORE || !CORE.state) return {};

        const out = {};
        const statusMap = CORE.state.moduleStatus || {};
        const modulesMap = CORE.state.modules || {};

        for (const name of Object.keys(statusMap)) {
            out[name] = {
                mounted: statusMap[name] === "mounted",
                hasTick: typeof modulesMap[name]?.tick === "function"
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
            mountedModules: getMountedModulesList(),
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
            const result = originalMount.call(CORE, name);
            captureRegistrySnapshot();
            return result;
        };

        CORE.unmount = (name) => {
            trackLifecycle("unmount", name);
            const result = originalUnmount.call(CORE, name);
            captureRegistrySnapshot();
            return result;
        };

        CORE.reload = (name) => {
            trackLifecycle("reload", name);
            const result = originalReload.call(CORE, name);
            captureRegistrySnapshot();
            return result;
        };
    }

    function getCoreLogs() {
        return getCoreLogsSource();
    }

    function getCoreErrors() {
        return getCoreErrorsSource();
    }

    function getLifecycleHistory() {
        // Merge OPS-side lifecycle with CORE-side lifecycle for richer view
        return [
            ...getLifecycleSource(),
            ...lifecycleHistory
        ];
    }

    function getRegistryKeys() {
        captureRegistrySnapshot();
        return registryKeys;
    }

    function getRegistryValues() {
        captureRegistrySnapshot();
        return registryValues;
    }

    function getCoreSnapshot() {
        const mountedModules = getMountedModulesList();
        const registry = getRegistrySource();
        const eventNames = getEventNamesSource();

        return {
            mountedModules,
            registry: { ...registry },
            eventNames
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
