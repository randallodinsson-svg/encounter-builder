// APEXCORE v3.3 — Core Kernel + Event Bus + Data Registry + Lifecycle System
// Clean, stable, modular, and future‑proof.

export const APEXCORE = {

    version: "3.3.0",

    state: {
        modules: {},        // name -> moduleRef
        moduleStatus: {},   // name -> "mounted" | "unmounted"
        logs: [],
        events: {},         // Event Bus
        registry: {}        // Data Registry
    },

    // =========================
    // MODULE REGISTRATION
    // =========================

    register(name, moduleRef) {
        if (!name || !moduleRef) return;
        this.state.modules[name] = moduleRef;
        if (!this.state.moduleStatus[name]) {
            this.state.moduleStatus[name] = "unmounted";
        }
        this.log(`Module registered: ${name}`);
    },

    // Explicit module getter (avoids conflict with registry.get)
    getModule(name) {
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
            core: "APEXCORE v3.3",
            status: "OK",
            modules: Object.keys(this.state.modules),
            mounted: Object.keys(this.state.moduleStatus)
                .filter(name => this.state.moduleStatus[name] === "mounted"),
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
    },

    // =========================
    // LIFECYCLE SYSTEM
    // =========================

    isMounted(name) {
        return this.state.moduleStatus[name] === "mounted";
    },

    mount(name) {
        const mod = this.state.modules[name];
        if (!mod) {
            this.log(`mount() failed — module not found: ${name}`);
            return;
        }
        if (this.isMounted(name)) {
            this.log(`mount() skipped — already mounted: ${name}`);
            return;
        }

        // Optional: call module.init if present
        if (typeof mod.init === "function") {
            try {
                mod.init(this);
            } catch (err) {
                this.log(`Error in ${name}.init(): ${err}`);
            }
        }

        this.state.moduleStatus[name] = "mounted";
        this.emit("module:mounted", { name });
        this.log(`Module mounted: ${name}`);
    },

    unmount(name) {
        const mod = this.state.modules[name];
        if (!mod) {
            this.log(`unmount() failed — module not found: ${name}`);
            return;
        }
        if (!this.isMounted(name)) {
            this.log(`unmount() skipped — not mounted: ${name}`);
            return;
        }

        // Optional: call module.destroy if present
        if (typeof mod.destroy === "function") {
            try {
                mod.destroy(this);
            } catch (err) {
                this.log(`Error in ${name}.destroy(): ${err}`);
            }
        }

        this.state.moduleStatus[name] = "unmounted";
        this.emit("module:unmounted", { name });
        this.log(`Module unmounted: ${name}`);
    },

    reload(name) {
        const mod = this.state.modules[name];
        if (!mod) {
            this.log(`reload() failed — module not found: ${name}`);
            return;
        }

        const wasMounted = this.isMounted(name);
        if (wasMounted) {
            this.unmount(name);
        }

        // Optional: call module.reload if present, otherwise remount
        if (typeof mod.reload === "function") {
            try {
                mod.reload(this);
                this.state.moduleStatus[name] = "mounted";
                this.emit("module:reloaded", { name });
                this.log(`Module reloaded: ${name}`);
                return;
            } catch (err) {
                this.log(`Error in ${name}.reload(): ${err}`);
            }
        }

        if (wasMounted) {
            this.mount(name);
            this.emit("module:reloaded", { name });
            this.log(`Module reloaded via unmount/mount: ${name}`);
        }
    }
};
