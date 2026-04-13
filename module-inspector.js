/*
    APEXCORE — Module Inspector
    Introspects APEXCORE modules and prints structured info to the console.
*/

(function () {
    function inspect() {
        if (typeof APEXCORE === "undefined") {
            console.warn("APEXCORE Module Inspector: APEXCORE not found.");
            return;
        }

        const snapshot = APEXCORE.snapshot();
        const rows = snapshot.modules.map((name) => {
            const mod = APEXCORE.get(name);
            return {
                name,
                hasUpdate: !!(mod && typeof mod.update === "function"),
                type: mod && mod.type ? mod.type : "generic"
            };
        });

        console.group("APEXCORE — Module Inspector");
        console.table(rows);
        console.log("Engine snapshot:", snapshot);
        console.groupEnd();
    }

    const ModuleInspector = {
        type: "tool",
        inspect
    };

    if (typeof APEXCORE !== "undefined") {
        APEXCORE.register("moduleInspector", ModuleInspector);
        console.log("APEXCORE — Module Inspector registered");
    }
})();
