/*
    APEXCORE v4.2 — Auto-Spawn System (FULLNUKE Edition)
    Creates a formation and entities at startup so the simulation is immediately visible.
*/

(function () {

    function start() {
        const formations = APEX.get("formations");
        const entities = APEX.get("entities");
        const ai = APEX.get("formation-ai");

        if (!formations || !entities || !ai) {
            console.error("Auto-Spawn — Missing required modules.");
            return;
        }

        console.log("Auto-Spawn — Creating formation and entities...");

        // Create formation at center of screen
        const form = formations.create(400, 300, 100, 8);

        // Create 8 entities
        const ents = [];
        for (let i = 0; i < 8; i++) {
            const e = entities.create(400, 300, { speed: 80 });
            ents.push(e);
        }

        // Assign entities to formation
        formations.assign(form, ents);

        // Set a target point for movement
        ai.setTarget(800, 300);

        console.log("Auto-Spawn — Formation created and moving.");
    }

    const AutoSpawnModule = {
        type: "auto-spawn",
        start
    };

    APEX.register("auto-spawn", AutoSpawnModule);
    console.log("APEXCORE v4.2 — Auto-Spawn System registered");

})();
