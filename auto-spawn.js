/*
    APEXCORE v4.4 — Auto-Spawn (Stable HALO Crew)
*/

(function () {

    function start() {
        const formations = APEX.get("formations");
        const entities = APEX.get("entities");
        const ai = APEX.get("formation-ai");

        if (!formations || !entities || !ai) {
            console.error("Auto-Spawn v4.4 — Missing required modules.");
            return;
        }

        console.log("Auto-Spawn v4.4 — Creating formation and entities...");

        const form = formations.create(400, 300, 100, 8);

        const ents = [];
        for (let i = 0; i < 8; i++) {
            ents.push(entities.create(400, 300, { speed: 90 }));
        }

        formations.assign(form, ents);
        ai.setTarget(800, 300);

        console.log("Auto-Spawn v4.4 — Formation created and moving.");
    }

    APEX.register("auto-spawn", {
        type: "auto-spawn",
        start
    });

})();
