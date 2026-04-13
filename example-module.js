/*
    APEXCORE v4.2 — Example Module
    Lightweight heartbeat module to prove the tick loop is alive.
*/

(function () {
    let lastLog = 0;

    const ExampleModule = {
        update(state) {
            if (state.time - lastLog > 2000) {
                console.log(
                    `APEXCORE v4.2 — Tick heartbeat | time=${Math.round(
                        state.time
                    )}ms | delta=${Math.round(state.delta)}ms`
                );
                lastLog = state.time;
            }
        }
    };

    APEX.register("example", ExampleModule);
})();
