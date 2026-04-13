/*
    APEXCORE v4.4 — Formation System (Stable HALO Crew)
*/

(function () {

    const formations = [];

    function createFormation(x, y, radius = 100, count = 8) {
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
        // v4.4 kept formation logic in AI; this stays minimal
    }

    APEX.register("formations", {
        type: "formations",
        create: createFormation,
        assign,
        all,
        update
    });

})();
