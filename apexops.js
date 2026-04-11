// APEXOPS v3 — Runtime Inspector + APEXCORE Diagnostics Integration
// Clean, stable, and fully compatible with APEXCORE v3.4

export const APEXOPS = {

    version: "3.0.0",

    init(core) {
        this.core = core;
        console.log("[APEXOPS] Initialized and connected to APEXCORE diagnostics.");
    },

    // =========================
    // CORE DIAGNOSTICS ACCESS
    // =========================

    getCoreLogs() {
        return this.core?.getLogs() || [];
    },

    getCoreErrors() {
        return this.core?.getErrors() || [];
    }, // <-- THIS COMMA WAS MISSING

    getLifecycleHistory() {
        return this.core?.getLifecycleHistory() || [];
    },

    getModuleStatus() {
        return this.core?.getModuleStatus() || {};
    },

    getRegistryKeys() {
        return Object.keys(this.core?.state?.registry || {});
    },

    getCoreSnapshot() {
        return this.core?.getDiagnosticsSnapshot() || null;
    },

    // =========================
    // OPS RUNTIME INSPECTION
    // =========================

    inspectRuntime(simState) {
        return {
            timestamp: Date.now(),
            sim: simState || null,
            core: this.getCoreSnapshot()
        };
    },

    // =========================
    // OPS EVENT HOOKS
    // =========================

    attachEventHooks() {
        if (!this.core) return;

        this.core.on("module:mounted", (e) => {
            console.log("[APEXOPS] Module mounted:", e.name);
        });

        this.core.on("module:unmounted", (e) => {
            console.log("[APEXOPS] Module unmounted:", e.name);
        });

        this.core.on("module:reloaded", (e) => {
            console.log("[APEXOPS] Module reloaded:", e.name);
        });

        this.core.on("registry:changed", (e) => {
            console.log("[APEXOPS] Registry changed:", e.key, "=", e.value);
        });

        this.core.on("registry:deleted", (e) => {
            console.log("[APEXOPS] Registry deleted:", e.key);
        });

        this.core.on("registry:cleared", () => {
            console.log("[APEXOPS] Registry cleared.");
        });

        console.log("[APEXOPS] Event hooks attached.");
    }
};
