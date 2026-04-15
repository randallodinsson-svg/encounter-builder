// formation-morphing.js — Phase 11 (Hybrid Morphing)

(function () {
  const Morphing = {
    start() {
      console.log("FORMATION_MORPHING — online (Phase 11).");
    },

    update(dt) {
      const ai = APEX.getModule("formation-ai");
      const influence = APEX.getModule("influence-maps");
      if (!ai || !influence) return;

      for (const f of ai.formations) {
        if (f.shapeCooldown > 0) {
          f.shapeCooldown -= dt;
        }

        const pressure = influence.sampleCoarse(f.x, f.y);
        const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);

        let desiredShape = f.shape;

        // Environmental push
        if (pressure > 350) {
          desiredShape = "cluster";
        } else if (pressure > 220) {
          desiredShape = "wedge";
        } else if (pressure > 120) {
          desiredShape = "arc";
        } else if (pressure < 60 && speed > 40) {
          desiredShape = "line";
        } else if (pressure < 60 && speed <= 40) {
          desiredShape = "spread";
        }

        // Behavioral refinement
        if (f.mode === "evade") {
          desiredShape = "cluster";
        } else if (f.mode === "approach") {
          if (pressure < 220) desiredShape = "wedge";
        } else if (f.mode === "orbit") {
          desiredShape = "arc";
        }

        if (desiredShape !== f.shape && f.shapeCooldown <= 0) {
          this.applyShape(f, desiredShape);
          f.shapeCooldown = 1.2; // seconds
        }
      }
    },

    applyShape(f, shape) {
      f.shape = shape;

      switch (shape) {
        case "line":
          f.cohesionRadius = 260;
          f.separationRadius = 70;
          f.shapeTension = 0.6;
          break;
        case "arc":
          f.cohesionRadius = 220;
          f.separationRadius = 80;
          f.shapeTension = 0.8;
          break;
        case "wedge":
          f.cohesionRadius = 200;
          f.separationRadius = 85;
          f.shapeTension = 1.0;
          break;
        case "cluster":
          f.cohesionRadius = 160;
          f.separationRadius = 60;
          f.shapeTension = 1.2;
          break;
        case "spread":
        default:
          f.cohesionRadius = 280;
          f.separationRadius = 90;
          f.shapeTension = 0.5;
          break;
      }
    },
  };

  APEX.register("formation-morphing", Morphing);
})();
