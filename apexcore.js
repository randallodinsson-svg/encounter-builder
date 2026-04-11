// APEXCORE v3 — Central System Core
// Clean, stable, dependency‑safe, and fully modular.

export const APEXCORE = {

    version: "3.0.0",

    state: {
        modules: {},
        logs: []
    },

    // Register a module into the core system
    register(name, moduleRef) {
        if (!name || !moduleRef) return;

        this.state.modules[name] = moduleRef;
        this.log(`Module registered: ${name}`);
    },

    // Retrieve a module
    get(name) {
        return this.state.modules[name] || null;
    },

    // Core logging
    log(msg) {
        const entry = `[APEXCORE] ${msg}`;
        this.state.logs.push(entry);
        console.log(entry);
    },

    // System heartbeat
    ping() {
        return {
            core: "APEXCORE v3",
            status: "OK",
            modules: Object.keys(this.state.modules),
            timestamp: Date.now()
        };
    }
};
