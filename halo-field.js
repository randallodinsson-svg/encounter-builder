/*
    APEXCORE v4.4 — HALO Field Export (Strong Influence)
    Provides a clean field API for APEXSIM to read:
        HALO_FIELD.sample(x, y, speciesId)
    Returns a force vector { fx, fy } based on HALO node positions.
*/

(function () {

  const HALO_FIELD = {
    _nodes: [],
    _strength: 1.0,   // global multiplier
    _radius: 180,     // influence radius (strong)
    _falloff: 1.4,    // how fast influence decays

    start() {
      console.log("APEXCORE v4.4 — HALO Field online.");
    },

    // Called by HALO renderer each frame
    updateFromHALO(nodes) {
      this._nodes = nodes || [];
    },

    // SIM calls this to get HALO influence at a point
    sample(x, y, speciesId) {
      if (!this._nodes || this._nodes.length === 0) {
        return { fx: 0, fy: 0 };
      }

      let fx = 0;
      let fy = 0;

      for (const n of this._nodes) {
        const dx = n.x - x;
        const dy = n.y - y;
        const distSq = dx * dx + dy * dy;

        if (distSq > this._radius * this._radius) continue;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;

        // Strong influence curve
        const influence =
          this._strength *
          Math.pow(1 - dist / this._radius, this._falloff);

        // Node type affects behavior
        let mode = n.type || "anchor";

        if (mode === "anchor") {
          // attract
          fx += nx * influence * 1.2;
          fy += ny * influence * 1.2;
        }
        else if (mode === "slot") {
          // orbit
          fx += -ny * influence * 1.0;
          fy += nx * influence * 1.0;
        }
        else {
          // free nodes repel slightly
          fx -= nx * influence * 0.6;
          fy -= ny * influence * 0.6;
        }
      }

      return { fx, fy };
    },

    setStrength(v) {
      this._strength = Math.max(0, Math.min(5, v));
    },

    setRadius(r) {
      this._radius = Math.max(20, Math.min(600, r));
    },
  };

  window.HALO_FIELD = HALO_FIELD;
  APEX.register("halo-field", HALO_FIELD);

})();
