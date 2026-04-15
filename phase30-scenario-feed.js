// phase30-scenario-feed.js
// APEXCORE v4.4 — Phase 30: Scenario Feed / Event Display Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Feed = (APEX.ScenarioFeed = APEX.ScenarioFeed || {});

  Feed.config = {
    maxItems: 10,
    minInterval: 0.6
  };

  Feed.state = {
    items: [],
    lastRenderTime: 0,
    lastSnapshotCount: 0
  };

  function formatTime(seconds) {
    return seconds.toFixed(1) + "s";
  }

  function classifyEvent(evt) {
    if (!evt || !evt.type) return "Event";

    switch (evt.type) {
      case "scenario_event":
        return "Scenario";
      default:
        return "Event";
    }
  }

  function buildLabel(evt) {
    if (!evt || !evt.data) return "";
    const d = evt.data;

    const t = (d.tension ?? 0).toFixed(2);
    const s = (d.salience ?? 0).toFixed(2);
    const c = (d.continuity ?? 0).toFixed(2);

    return `T:${t} S:${s} C:${c}`;
  }

  function syncFromScenarioMemory() {
    if (!APEX.ScenarioMemory || !APEX.ScenarioMemory.state) return [];

    const events = APEX.ScenarioMemory.state.events || [];
    return events.slice(-Feed.config.maxItems);
  }

  function renderFeed() {
    const container = document.getElementById("scenario-feed-items");
    if (!container) return;

    const events = syncFromScenarioMemory();
    Feed.state.items = events;

    container.innerHTML = "";

    const now = performance.now() / 1000;

    for (let i = events.length - 1; i >= 0; i--) {
      const evt = events[i];
      const row = document.createElement("div");
      row.className = "scenario-feed-item";

      const timeSpan = document.createElement("span");
      timeSpan.className = "time";
      timeSpan.textContent = "[" + formatTime(now - evt.time) + "]";

      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = classifyEvent(evt);

      const metaSpan = document.createElement("span");
      metaSpan.className = "meta";
      metaSpan.textContent = buildLabel(evt);

      row.appendChild(timeSpan);
      row.appendChild(labelSpan);
      row.appendChild(metaSpan);

      container.appendChild(row);
    }

    Feed.state.lastRenderTime = now;
    Feed.state.lastSnapshotCount = events.length;
  }

  Feed.updateFeed = function (dt) {
    const now = performance.now() / 1000;
    if (now - Feed.state.lastRenderTime < Feed.config.minInterval) return;

    renderFeed();
  };

  console.log("PHASE30_FEED — online (Scenario Feed Layer).");
})(this);
