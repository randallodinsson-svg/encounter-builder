/*
    APEXCORE v4.2 — Auto-Spawn Module (Phase 7)
    Automatically spawns an 8-entity formation and moves it to a target on page load.
*/

(function () {

    function initAutoSpawn() {
        const ents = APEX.get("entities");
        const forms = APEX.get("formations");
        const ai = APEX.get("formation-ai");

        if (!ents || !forms || !ai) {
            console.warn("Auto-Spawn: Required modules not ready.");
            return;
        }

        // Create formation
        const f = forms.create("circle");

        // Spawn 8 entities
        for (let i = 0; i < 8; i++) {
            const e = ents.create(0, 0);
            forms.addMember(f, e);
        }

        // Center formation
        f.x = 400;
        f.y = 300;

        // Move formation to a target (Phase 7 AI)
        ai.setTarget(f, 700, 300);

        console.log("Auto-Spawn: Formation created and moving.");
    }

    // Register module
    const AutoSpawnModule = {
        type: "auto-spawn",
        start() {
            initAutoSpawn();
        }
    };

    if (typeof APEX !== "undefined") {
        APEX.register("auto-spawn", AutoSpawnModule);
        console.log("APEXCORE v4.2 — Auto-Spawn Module registered");
    } else {
        console.warn("APEXCORE v4.2 — Auto-Spawn: APEX core not found.");
    }

})();
