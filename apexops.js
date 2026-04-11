// APEXOPS v3.6 — Runtime Inspector + Diagnostics Layer + Registry Value Viewer

export const APEXOPS = {

    core: null,

    init(core) {
        this.core = core;
        console.log("[APEXOPS] Initialized and connected to APEXCORE diagnostics.");
    },

    attachEventHooks() {
        if (!this.core) return;

        // MODULE LIFECYCLE
        this.core.on("module:mounted", (e) => {
            console.log("[APEXOPS] Module mounted:", e.name);
        });

        this.core.on("module:unmounted", (e) => {
            console.log("[APEXOPS] Module unmounted:", e.name);
        });

        this.core.on("module:reloaded", (e) => {
            console.log("[APEXOPS] Module reloaded:", e.name);
        });

        // REGISTRY EVENTS
        this.core.on("registry:changed", (e) => {
            console.log("[APEXOPS] Registry changed:", e.key, "=", e.value);
        });

        this.core.on("registry:deleted", (e) => {
            console.log("[APEXOPS] Registry deleted:", e.key);
        });

        this.core.on("registry:cleared", () => {
            console.log("[APEXOPS] Registry cleared.");
        });

        // ⭐ STEP 14 — TICK EVENT DIAGNOSTICS
        this.core.on("module:tick", (e) => {
            console.log("[APEXOPS] Module tick:", e.name, e.tick);
        });

        console.log("[APEXOPS] Event hooks attached.");
    },

    // ============================
    // DIAGNOSTICS ACCESSORS
    // ============================

    getCoreLogs() {
        return this.core.getLogs();
    },

    getCoreErrors() {
        return this.core.getErrors();
    },

    getLifecycleHistory() {
        return this.core.getLifecycleHistory();
    },

    getModuleStatus() {
        return this.core.getModuleStatus();
    },

    getRegistryKeys() {
        return this.core.getDiagnosticsSnapshot().registryKeys;
    },

    // ⭐ STEP 15 — FULL REGISTRY VALUE ACCESS
    getRegistryValues() {
        return this.core.state.registry;
    },

    getCoreSnapshot() {
        return this.core.getDiagnosticsSnapshot();
    },

    inspectRuntime(simTick) {
        return {
            timestamp: Date.now(),
            sim: simTick,
            core: this.core.getDiagnosticsSnapshot()
        };
    }
};
