/*
    APEXCORE v4.2 — Formation System (FULLNUKE Edition)
    Creates and manages formations that group entities into structured shapes.
*/

(function () {

    const formations = [];

    function createFormation(x, y, radius = 80, count = 8) {
        const f = {
            id: crypto.randomUUID ? crypto.randomUUID() : ("form-" + Math.random().toString(36).slice(2)),
            x: x || 0,
            y: y || 0,
            radius,
            count,
            members: []
        };

        formations.push(f);
        return f;
    }

    function all() {
        return formations;
    }

    function assignEntitiesToFormation(formation, entities) {
        if (!formation || !entities || entities.length === 0) return;

        formation.members = entities;
    }

    function update(state) {
        // Formations themselves don’t move unless AI or auto‑spawn modifies them.
        // This keeps the system stable and predictable.
    }

    const FormationModule = {
        type: "formations",
        create: createFormation,
        assign: assignEntitiesToFormation,
        all,
        update
    };

    APEX.register("formations", FormationModule);
    console.log("APEXCORE v4.2 — Formation System registered");

})();
