/*
    APEXCORE v4.4 — Event Timeline Visualizer (Updated)
    Records timestamped engine events for debugging.
*/

(function () {
  const Timeline = {
    events: [],
    maxEvents: 200,

    start() {
      console.log("APEXCORE v4.4 — Event Timeline Visualizer registered");
    },

    onTick(delta, tick) {
      this.push(`tick:${tick}`, delta);
    },

    push(label, data) {
      const entry = {
        t: performance.now(),
        label,
        data,
      };

      this.events.push(entry);
      if (this.events.length > this.maxEvents) {
        this.events.shift();
      }

      // Optional global for UI panels
      window.APEX_TIMELINE = this.events;
    },
  };

  APEX.register("event-timeline", Timeline);
})();
