/*
    APEXCORE — Registry Diff Viewer
    Tracks changes in the module registry over time.
*/

(function () {
    let lastSnapshot = [];

    function diffArrays(prev, next) {
        const removed = prev.filter((x) => !next.includes(x));
        const added = next.filter((x) => !prev.includes(x));
        return { added, removed };
    }

    function capture() {
        if (typeof APEXCORE === "undefined") {
            console.warn("APEXCORE Registry Diff Viewer: APEXCORE not found.");
            return;
        }

        const snapshot = APEXCORE.snapshot();
        const current = snapshot.modules.slice().sort();
        const prev = lastSnapshot.slice().sort();

        const { added, removed } = diffArrays(prev, current);

        console.group("APEXCORE — Registry Diff");
        console.log("Previous:", prev);
        console.log("Current:", current);
        console.log("Added:", added);
        console.log("Removed:", removed);
        console.groupEnd();

        lastSnapshot = current;
    }

    const RegistryDiffViewer = {
        type: "tool",
        capture
    };

    if (typeof APEXCORE !== "undefined") {
        APEXCORE.register("registryDiffViewer", RegistryDiffViewer);
        console.log("APEXCORE — Registry Diff Viewer registered");
    }
})();
