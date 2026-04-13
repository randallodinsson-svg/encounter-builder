/*
    APEXCORE v4.2 — Entity System (FULLNUKE Edition)
    Manages all entities used by formations, AI, and renderer.
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
            speed: options.speed || 60,
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
            if (!e) continue;

            e.x += (e.vx || 0) * dt;
            e.y += (e.vy || 0) * dt;
        }
    }

    const EntityModule = {
        type: "entities",
        create: createEntity,
        all,
        update
    };

    APEX.register("entities", EntityModule);
    console.log("APEXCORE v4.2 — Entity System registered");

})();
