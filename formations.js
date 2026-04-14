/*
    APEXCORE v4.4 — Formation System (Renderer-Aligned, AI-Ready)
*/

(function () {

    const formations = [];

    function createFormation(x, y, radius = 100, count = 8) {
        const f = {
            id: crypto.randomUUID ? crypto.randomUUID() : ("form-" + Math.random().toString(36).slice(2)),
            center: { x, y },
            radius,
            count,
            members: [],
            vx: 0,
            vy: 0
        };

        formations.push(f);
        return f;
    }

    function assign(formation, entities) {
        formation.members = entities;

        const step = (Math.PI * 2) / formation.count;

        for (let i = 0; i < entities.length; i++) {
            const angle = i * step;
            entities[i].position.x = formation.center.x + Math.cos(angle) * formation.radius;
            entities[i].position.y = formation.center.y + Math.sin(angle) * formation.radius;
        }
    }

    function all() {
        return formations;
    }

    function getAll() {
        return formations;
    }

    function update(dt) {
        for (const f of formations) {
            f.center.x += f.vx * dt;
            f.center.y += f.vy * dt;

            const step = (Math.PI * 2) / f.count;

            for (let i = 0; i < f.members.length; i++) {
                const angle = i * step;
                const e = f.members[i];

                e.position.x = f.center.x + Math.cos(angle) * f.radius;
                e.position.y = f.center.y + Math.sin(angle) * f.radius;
            }
        }
    }

    APEX.register("formations", {
        type: "formations",
        create: createFormation,
        assign,
        all,
        getAll,
        update
    });

})();
