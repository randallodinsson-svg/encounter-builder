// APEXCORE v3.1 — Central System Core + Event Bus
// Clean, stable, dependency‑safe, and fully modular.

export const APEXCORE = {

    version: "3.1.0",

    state: {
        modules: {},
        logs: [],
        events: {} // { eventName: [listener, ...] }
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
            core: "APEXCORE v3.1",
            status: "OK",
            modules: Object.keys(this.state.modules),
            timestamp: Date.now()
        };
    },

    // =========================
    // EVENT BUS
    // =========================

    // Subscribe to an event
    on(eventName, listener) {
        if (!eventName || typeof listener !== "function") return;

        if (!this.state.events[eventName]) {
            this.state.events[eventName] = [];
        }
        this.state.events[eventName].push(listener);
        this.log(`Listener added for event: ${eventName}`);
    },

    // Unsubscribe from an event
    off(eventName, listener) {
        const list = this.state.events[eventName];
        if (!list) return;

        this.state.events[eventName] = list.filter(fn => fn !== listener);
        this.log(`Listener removed for event: ${eventName}`);
    },

    // Emit an event
    emit(eventName, payload) {
        const list = this.state.events[eventName];
        if (!list || list.length === 0) return;

        this.log(`Event emitted: ${eventName}`);
        for (const fn of list) {
            try {
                fn(payload);
            } catch (err) {
                this.log(`Error in listener for event "${eventName}": ${err}`);
            }
        }
    },

    // Subscribe once to an event
    once(eventName, listener) {
        if (!eventName || typeof listener !== "function") return;

        const wrapper = (payload) => {
            this.off(eventName, wrapper);
            listener(payload);
        };

        this.on(eventName, wrapper);
    }
};
