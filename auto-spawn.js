/*
    APEXCORE v4.2 — Auto-Spawn System (FULLNUKE Edition)
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

        const form = formations.create(400, 300, 100, 8);

        const ents = [];
        for (let i = 0; i < 8; i++) {
            ents.push(entities.create(400, 300, { speed: 80 }));
        }

        formations.assign(form, ents);
        ai.setTarget(800, 300);

        console.log("Auto-Spawn — Formation created and moving.");
    }

    APEX.register("auto-spawn", { type: "auto-spawn", start });

})();
