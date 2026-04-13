/*
    APEXCORE — Modern Engine Kernel
    Standalone, non-interfering with v4.2 (uses APEXCORE namespace, not APEX).
*/

const APEXCORE = (function () {
    const modules = {};
    const listeners = {
        tick: [],
        event: []
    };

    const state = {
        running: false,
        lastTick: 0,
        delta: 0,
        time: 0,
        frame: 0
    };

    function register(name, module) {
        modules[name] = module;
    }

    function get(name) {
        return modules[name];
    }

    function onTick(fn) {
        listeners.tick.push(fn);
    }

    function onEvent(fn) {
        listeners.event.push(fn);
    }

    function emitEvent(type, payload) {
        const evt = {
            type,
            payload,
            time: performance.now()
        };
        for (const fn of listeners.event) {
            try {
                fn(evt);
            } catch (err) {
                console.error("APEXCORE event listener error:", err);
            }
        }
    }

    function tick(now) {
        if (!state.running) return;

        if (state.lastTick === 0) {
            state.lastTick = now;
        }

        state.delta = now - state.lastTick;
        state.lastTick = now;
        state.time += state.delta;
        state.frame++;

        // Module updates
        for (const key in modules) {
            const mod = modules[key];
            if (mod && typeof mod.update === "function") {
                try {
                    mod.update(state);
                } catch (err) {
                    console.error(`APEXCORE module "${key}" update error:`, err);
                }
            }
        }

        // Tick listeners
        for (const fn of listeners.tick) {
            try {
                fn({ ...state });
            } catch (err) {
                console.error("APEXCORE tick listener error:", err);
            }
        }

        requestAnimationFrame(tick);
    }

    function start() {
        if (state.running) return;
        state.running = true;
        state.lastTick = 0;
        requestAnimationFrame(tick);
        console.log("APEXCORE — Engine started");
    }

    function stop() {
        state.running = false;
        console.log("APEXCORE — Engine stopped");
    }

    function snapshot() {
        return {
            time: state.time,
            delta: state.delta,
            frame: state.frame,
            running: state.running,
            modules: Object.keys(modules)
        };
    }

    return {
        register,
        get,
        onTick,
        onEvent,
        emitEvent,
        start,
        stop,
        snapshot
    };
})();
