// apexops.js — high-level operations (reset, burst)

(function () {
  const OPS = {
    start() {
      console.log("APEXOPS — online.");
    },

    reset() {
      const sim = APEX.getModule("apexsim");
      if (sim) sim.reset();
    },

    burst() {
      const sim = APEX.getModule("apexsim");
      if (sim) sim.burst();
    },
  };

  APEX.register("apexops", OPS);
})();
