/*
    APEXCORE v4.2 — Entity System (Phase 5)
    Lightweight entity registry + renderer hooks.
*/

(function () {
    const entities = [];
    let nextId = 1;

    function createEntity(x, y, color = "rgba(0,255,180,0.9)") {
        const e = {
            id: nextId++,
            x,
            y,
            color,
            radius: 8,
            vx: 0,
            vy: 0
        };
        entities.push(e);
        return e;
    }

    function updateEntities(state) {
        const dt = state.delta * 0.001;

        for (const e of entities) {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
        }
    }

    function renderEntities(ctx, width, height) {
        for (const e of entities) {
            ctx.beginPath();
            ctx.fillStyle = e.color;
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const EntityModule = {
        type: "entities",
        update(state) {
            updateEntities(state);
        },
        render(ctx, width, height) {
            renderEntities(ctx, width, height);
        },
        create: createEntity,
        all: () => entities
    };

    if (typeof APEX !== "undefined") {
        APEX.register("entities", EntityModule);
        console.log("APEXCORE v4.2 — Entity System registered");
    } else {
        console.warn("APEXCORE v4.2 — Entity System: APEX core not found.");
    }
})();
