/*
    APEXCORE v4.4 — UI Controller
    Handles Diagnostics Panel updates + UI bindings
*/

(function () {

    const UI = {
        fpsEl: null,
        deltaEl: null,
        avgEl: null,
        minEl: null,
        maxEl: null,
        entitiesEl: null,
        eventsEl: null,
        timelineFeed: null,

        deltas: [],

        start() {
            // Bind elements
            this.fpsEl = document.getElementById("diag-fps");
            this.deltaEl = document.getElementById("diag-delta");
            this.avgEl = document.getElementById("diag-avg");
            this.minEl = document.getElementById("diag-min");
            this.maxEl = document.getElementById("diag-max");
            this.entitiesEl = document.getElementById("diag-entities");
            this.eventsEl = document.getElementById("diag-events");
            this.timelineFeed = document.getElementById("diag-timeline-feed");

            console.log("APEXCORE v4.4 — UI online.");
        },

        onTick(delta, fps, entityCount, eventCount) {
            if (!this.fpsEl) return;

            // Update FPS + Δ
            this.fpsEl.textContent = Math.round(fps);
            this.deltaEl.textContent = `${delta.toFixed(2)} ms`;

            // Track rolling deltas
            this.deltas.push(delta);
            if (this.deltas.length > 120) this.deltas.shift();

            const avg = this.deltas.reduce((a, b) => a + b, 0) / this.deltas.length;
            const min = Math.min(...this.deltas);
            const max = Math.max(...this.deltas);

            this.avgEl.textContent = `${avg.toFixed(2)} ms`;
            this.minEl.textContent = `${min.toFixed(2)} ms`;
            this.maxEl.textContent = `${max.toFixed(2)} ms`;

            // Entities + Events
            this.entitiesEl.textContent = entityCount;
            this.eventsEl.textContent = eventCount;
        },

        pushTimelineEvent(text) {
            if (!this.timelineFeed) return;

            const time = new Date().toLocaleTimeString();
            this.timelineFeed.textContent += `[${time}] ${text}\n`;

            // Auto-scroll
            this.timelineFeed.parentElement.scrollTop =
                this.timelineFeed.parentElement.scrollHeight;
        }
    };

    APEX.register("ui", UI);

})();
