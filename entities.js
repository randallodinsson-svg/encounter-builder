/*
    APEXCORE v4.4 — Entity System (Stable HALO Crew)
*/

(function () {

    const entities = [];

    function createEntity(x, y, options = {}) {
        const e = {
            id: crypto.randomUUID ? crypto.randomUUID() : ("ent-" + Math.random().toString(36).slice(2)),
            x: x || 0,
            y: y || 0,
            vx: 0,
            vy: 0,
            speed: options.speed || 80,
            role: options.role || "unit",
            data: options.data || {}
        };

        entities.push(e);
        return e;
    }

    function all() {
        return entities;
    }

    function update(state) {
        const dt = (state.delta || 16.67) / 1000;

        for (const e of entities) {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
        }
    }

    APEX.register("entities", {
        type: "entities",
        create: createEntity,
        all,
        update
    });

})();
