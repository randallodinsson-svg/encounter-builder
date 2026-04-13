/*
    APEXCORE v4.2 — Formation System (B1-A Clean Tactical Sim)
*/

(function () {

    const formations = [];

    function createFormation(x, y, radius = 80, count = 8) {
        const f = {
            id: crypto.randomUUID ? crypto.randomUUID() : ("form-" + Math.random().toString(36).slice(2)),
            x,
            y,
            radius,
            count,
            members: []
        };

        formations.push(f);
        return f;
    }

    function assign(formation, entities) {
        formation.members = entities;
    }

    function all() {
        return formations;
    }

    function update() {
        // Reserved for future formation-level logic
    }

    APEX.register("formations", {
        type: "formations",
        create: createFormation,
        assign,
        all,
        update
    });

})();
