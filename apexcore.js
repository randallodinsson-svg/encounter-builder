// APEXCORE v3.2 — Core Kernel + Event Bus + Data Registry
// Clean, stable, modular, and future‑proof.

export const APEXCORE = {

    version: "3.2.0",

    state: {
        modules: {},
        logs: [],
        events: {},      // Event Bus
        registry: {}     // Data Registry
    },

    // =========================
    // MODULE REGISTRATION
    // =========================

    register(name, moduleRef) {
        if (!name || !moduleRef) return;
        this.state.modules[name] = moduleRef;
        this.log(`Module registered: ${name}`);
    },

    get(name) {
        return this.state.modules[name] || null;
    },

    // =========================
    // LOGGING
    // =========================

    log(msg) {
        const entry = `[APEXCORE] ${msg}`;
        this.state.logs.push(entry);
        console.log(entry);
    },

    // =========================
    // HEARTBEAT
    // =========================

    ping() {
        return {
            core: "APEXCORE v3.2",
            status: "OK",
            modules: Object.keys(this.state.modules),
            timestamp: Date.now()
        };
    },

    // =========================
    // EVENT BUS
    // =========================

    on(eventName, listener) {
        if (!eventName || typeof listener !== "function") return;

        if (!this.state.events[eventName]) {
            this.state.events[eventName] = [];
        }
        this.state.events[eventName].push(listener);
        this.log(`Listener added for event: ${eventName}`);
    },

    off(eventName, listener) {
        const list = this.state.events[eventName];
        if (!list) return;

        this.state.events[eventName] = list.filter(fn => fn !== listener);
        this.log(`Listener removed for event: ${eventName}`);
    },

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

    once(eventName, listener) {
        if (!eventName || typeof listener !== "function") return;

        const wrapper = (payload) => {
            this.off(eventName, wrapper);
            listener(payload);
        };

        this.on(eventName, wrapper);
    },

    // =========================
    // DATA REGISTRY
    // =========================

    set(key, value) {
        this.state.registry[key] = value;

        this.emit("registry:changed", { key, value });
        this.log(`Registry set: ${key}`);
    },

    get(key) {
        return this.state.registry[key];
    },

    has(key) {
        return Object.prototype.hasOwnProperty.call(this.state.registry, key);
    },

    delete(key) {
        if (this.has(key)) {
            delete this.state.registry[key];
            this.emit("registry:deleted", { key });
            this.log(`Registry deleted: ${key}`);
        }
    },

    clear() {
        this.state.registry = {};
        this.emit("registry:cleared", {});
        this.log("Registry cleared.");
    }
};
