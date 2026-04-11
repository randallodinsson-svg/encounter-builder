/* ============================================================
   APEXSIM v4.x — Stabilized Simulation Engine
   Clean, deterministic, canvas‑based, modular
   Compatible with APEXCORE v3, APEXOPS v2, APEXAI v3
   ============================================================ */

export const APEXSIM = (() => {

    /* ------------------------------------------------------------
       INTERNAL STATE
    ------------------------------------------------------------ */
    let canvas = null;
    let ctx = null;

    let tick = 0;

    const state = {
        entities: [],
        scenario: null,
        lastStep: null
    };

    /* ------------------------------------------------------------
       UTILITY
    ------------------------------------------------------------ */

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clearCanvas() {
        if (!ctx) return;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawEntities() {
        if (!ctx) return;

        for (const e of state.entities) {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.size, e.size);
        }
    }

    /* ------------------------------------------------------------
       ENTITY SYSTEM
    ------------------------------------------------------------ */

    function spawnEntity(x, y, color = "#1e90ff") {
        const entity = {
            id: "ENT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            x,
            y,
            vx: rand(-2, 2),
            vy: rand(-2, 2),
            size: rand(6, 12),
            color
        };

        state.entities.push(entity);
        return entity;
    }

    function updateEntities() {
        for (const e of state.entities) {
            e.x += e.vx;
            e.y += e.vy;

            // bounce off edges
            if (e.x < 0 || e.x + e.size > canvas.width) e.vx *= -1;
            if (e.y < 0 || e.y + e.size > canvas.height) e.vy *= -1;
        }
    }

    /* ------------------------------------------------------------
       SCENARIO SYSTEM
    ------------------------------------------------------------ */

    function loadDefaultScenario() {
        const scenario = {
            name: "Default Simulation Scenario",
            entityCount: 12,
            colors: ["#1e90ff", "#ff4757", "#ffa502", "#2ed573"]
        };

        state.entities = [];

        for (let i = 0; i < scenario.entityCount; i++) {
            spawnEntity(
                rand(20, canvas.width - 20),
                rand(20, canvas.height - 20),
                scenario.colors[rand(0, scenario.colors.length - 1)]
            );
        }

        state.scenario = scenario;
        return scenario;
    }

    /* ------------------------------------------------------------
       SIMULATION CORE
    ------------------------------------------------------------ */

    function init(c) {
        canvas = c;
        ctx = canvas.getContext("2d");

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        clearCanvas();

        return true;
    }

    function step() {
        tick++;

        updateEntities();
        clearCanvas();
        drawEntities();

        const result = {
            tick,
            entityCount: state.entities.length,
            timestamp: Date.now()
        };

        state.lastStep = result;
        return result;
    }

    function reset() {
        tick = 0;
        state.entities = [];
        state.scenario = null;
        state.lastStep = null;

        clearCanvas();
    }

    /* ------------------------------------------------------------
       PUBLIC API
    ------------------------------------------------------------ */

    return {
        init,
        step,
        reset,
        loadDefaultScenario,
        spawnEntity,
        getState: () => JSON.parse(JSON.stringify(state))
    };

})();
