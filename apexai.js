// FILE: apexai.js
/*
    APEXAI v1.0 — Decision Layer Core
    Lightweight behavior + decision system for APEXCORE.
*/

(function () {
  if (!window.APEX) {
    console.warn("APEXAI: APEX not found.");
    return;
  }

  const APEX = window.APEX;
  const Events = APEX.getModule("events");

  const APEXAI = {
    version: "1.0",
    enabled: true,

    // Internal state for AI agents
    agents: [],

    // Register a new AI agent
    registerAgent(agent) {
      if (!agent || typeof agent.update !== "function") {
        console.warn("APEXAI: invalid agent", agent);
        return;
      }
      this.agents.push(agent);
    },

    // Remove an agent
    removeAgent(agent) {
      this.agents = this.agents.filter((a) => a !== agent);
    },

    // Called by engine on module init
    init() {
      console.log("APEXAI v1.0 — Initialized.");
    },

    // Called by engine on module start
    start() {
      console.log("APEXAI v1.0 — Active.");
    },

    // Called every engine tick
    update(dt) {
      if (!this.enabled) return;

      for (let i = 0; i < this.agents.length; i++) {
        try {
          this.agents[i].update(dt);
        } catch (err) {
          console.error("APEXAI: agent update error", err);
        }
      }
    },

    // Toggle AI system
    toggle() {
      this.enabled = !this.enabled;
      console.log(`APEXAI: ${this.enabled ? "Enabled" : "Disabled"}`);
    },
  };

  // Register OPS commands
  const OPS = APEX.getModule("ops");
  if (OPS) {
    OPS.register("ai.toggle", () => APEXAI.toggle());
    OPS.register("ai.inspect", () => {
      console.log("APEXAI Agents:", APEXAI.agents);
    });
  }

  // Register with APEX
  APEX.register("ai", APEXAI);
})();
