/*
    APEXCORE — Event Timeline Visualizer
    Records engine events and prints a rolling timeline.
*/

(function () {
    if (typeof APEXCORE === "undefined") {
        console.warn("APEXCORE Event Timeline: APEXCORE not found.");
        return;
    }

    const MAX_EVENTS = 100;
    const events = [];

    function record(evt) {
        events.push(evt);
        if (events.length > MAX_EVENTS) {
            events.shift();
        }
    }

    function dump() {
        const rows = events.map((e, i) => ({
            idx: i,
            type: e.type,
            time: Math.round(e.time),
            payload: e.payload
        }));

        console.group("APEXCORE — Event Timeline");
        console.table(rows);
        console.groupEnd();
    }

    APEXCORE.onEvent((evt) => {
        record(evt);
    });

    // Expose a small control module
    const EventTimeline = {
        type: "tool",
        dump
    };

    APEXCORE.register("eventTimeline", EventTimeline);
    console.log("APEXCORE — Event Timeline Visualizer registered");
})();
