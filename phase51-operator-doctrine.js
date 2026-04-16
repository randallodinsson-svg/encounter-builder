// phase51-operator-doctrine.js
// APEXCORE v4.4 — Phase 51: Operator Doctrine Layer (Adaptive)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});

  const Doctrine = (APEX.OperatorDoctrine = APEX.OperatorDoctrine || {});

  Doctrine.state = {
    lastUpdateTime: 0,
    analysisInterval: 12.0 // seconds between doctrine passes
  };

  Doctrine.config = {
    baseDriftRate: 0.015,
    baseConvictionDrift: 0.02,
    minConvictionForEffects: 0.18,
    schismThreshold: 0.78,
    unificationThreshold: 0.82
  };

  const STANCES = ["REVERENT", "PRAGMATIC", "SUSPICIOUS", "DEFIANT"];
  const PHILOSOPHIES = [
    "GUARDIAN",
    "ARBITER",
    "FAVORITIST",
    "TRICKSTER",
    "DISTANT",
    "VOLATILE"
  ];

  function now() {
    return performance.now() / 1000;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function pushDoctrineEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  // -------------------------
  // Sampling operator context
  // -------------------------

  function sampleReputation() {
    if (!APEX.OperatorReputation || !APEX.OperatorReputation.state) {
      return {
        fairness: 0.5,
        stability: 0.5,
        benevolence: 0.5,
        predictability: 0.5,
        favoritism: 0.5
      };
    }

    const cs = APEX.OperatorReputation.state.coalitions || [];
    if (!cs.length) {
      return {
        fairness: 0.5,
        stability: 0.5,
        benevolence: 0.5,
        predictability: 0.5,
        favoritism: 0.5
      };
    }

    let f = 0,
      s = 0,
      b = 0,
      p = 0,
      fav = 0;
    for (let i = 0; i < cs.length; i++) {
      f += cs[i].fairness;
      s += cs[i].stability;
      b += cs[i].benevolence;
      p += cs[i].predictability;
      fav += cs[i].favoritism;
    }
    const n = cs.length || 1;
    return {
      fairness: f / n,
      stability: s / n,
      benevolence: b / n,
      predictability: p / n,
      favoritism: fav / n
    };
  }

  function sampleEpoch() {
    if (!APEX.Epoch || !APEX.Epoch.state) {
      return { label: "ERA_DEFAULT", confidence: 0.0 };
    }
    return {
      label: APEX.Epoch.state.current || "ERA_DEFAULT",
      confidence: APEX.Epoch.state.confidence || 0.0
    };
  }

  function sampleMythology() {
    if (!APEX.Mythology || !APEX.Mythology.state) {
      return { myths: [] };
    }
    return {
      myths: APEX.Mythology.state.myths || []
    };
  }

  function sampleConflict() {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) {
      return { avgTension: 0.5 };
    }
    const tensions = APEX.CoalConflict.state.tensions || [];
    if (!tensions.length) return { avgTension: 0.5 };

    let sum = 0;
    for (let i = 0; i < tensions.length; i++) {
      sum += tensions[i].level || 0;
    }
    return { avgTension: clamp01(sum / tensions.length) };
  }

  // -------------------------
  // Doctrine structure
  // -------------------------
  // doctrine = {
  //   stance,
  //   philosophy,
  //   conviction,   // 0..1
  //   drift,        // 0..1
  //   lastShift,
  //   epochAnchor,
  //   mythAnchorId  // id of most influential myth at formation (if any)
  // }

  function ensureDoctrineRecord(coalition, epoch, mythContext, rep, conflict) {
    if (!coalition.doctrine) {
      coalition.doctrine = createDoctrine(coalition, epoch, mythContext, rep, conflict);
    }
    return coalition.doctrine;
  }

  function createDoctrine(coalition, epoch, mythContext, rep, conflict) {
    const myth = pickAnchorMyth(mythContext, coalition);
    const stance = pickInitialStance(rep, conflict, myth);
    const philosophy = pickInitialPhilosophy(rep, epoch, myth);

    const doctrine = {
      stance,
      philosophy,
      conviction: clamp01(0.3 + randRange(-0.1, 0.1)),
      drift: clamp01(0.25 + randRange(-0.1, 0.1)),
      lastShift: now(),
      epochAnchor: epoch.label,
      mythAnchorId: myth ? myth.id : null
    };

    pushDoctrineEvent(
      "Doctrine Formed",
      coalition.name
        ? coalition.name + " adopts a doctrine: " + describeDoctrine(doctrine) + "."
        : "A coalition adopts a doctrine: " + describeDoctrine(doctrine) + "."
    );

    return doctrine;
  }

  function pickAnchorMyth(mythContext, coalition) {
    const myths = mythContext.myths || [];
    if (!myths.length) return null;

    let best = null;
    let bestScore = 0;

    for (let i = 0; i < myths.length; i++) {
      const m = myths[i];
      const influence = m.influence || 0;
      if (!m.coalitionBiases) continue;

      const cid = coalition.id != null ? coalition.id : i;
      const affinity = m.coalitionBiases[cid] || 0;

      const score = influence * (0.6 + 0.4 * Math.abs(affinity));
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }

    if (bestScore < 0.15) return null;
    return best;
  }

  function pickInitialStance(rep, conflict, myth) {
    const t = conflict.avgTension;
    const f = rep.fairness;
    const b = rep.benevolence;
    const fav = rep.favoritism;

    if (myth) {
      // Myth stance heavily biases doctrine stance
      if (myth.stance === "REVERENT") return "REVERENT";
      if (myth.stance === "DEFIANT") return "DEFIANT";
      if (myth.stance === "SUSPICIOUS") return "SUSPICIOUS";
      if (myth.stance === "PRAGMATIC") return "PRAGMATIC";
    }

    if (f > 0.65 && b > 0.6 && t < 0.55) return "REVERENT";
    if (fav > 0.65 && f < 0.55) return "SUSPICIOUS";
    if (t > 0.7) return "DEFIANT";
    return "PRAGMATIC";
  }

  function pickInitialPhilosophy(rep, epoch, myth) {
    if (myth) {
      // Map myth theme to doctrine philosophy
      switch (myth.theme) {
        case "BENEVOLENT":
          return "GUARDIAN";
        case "ARBITER":
          return "ARBITER";
        case "FAVORITIST":
          return "FAVORITIST";
        case "TRICKSTER":
          return "TRICKSTER";
        case "DISTANT":
          return "DISTANT";
        case "VOLATILE":
          return "VOLATILE";
      }
    }

    const f = rep.fairness;
    const b = rep.benevolence;
    const fav = rep.favoritism;
    const epochLabel = epoch.label;

    if (f > 0.65 && b > 0.65 && fav < 0.5) return "GUARDIAN";
    if (fav > 0.7) return "FAVORITIST";
    if (epochLabel === "ERA_UNSEEN_PATTERNS") return "TRICKSTER";
    if (epochLabel === "ERA_DISTANT_EQUILIBRIUM") return "DISTANT";
    if (epochLabel === "ERA_TURBULENT_ORDERS") return "VOLATILE";
    return "ARBITER";
  }

  function describeDoctrine(doc) {
    const stance = doc.stance.toLowerCase();
    const phil = doc.philosophy.toLowerCase();

    if (doc.philosophy === "GUARDIAN" && doc.stance === "REVERENT")
      return "Reverent Guardian — the Operator as a quiet, protective balance";
    if (doc.philosophy === "GUARDIAN" && doc.stance === "PRAGMATIC")
      return "Measured Guardian — the Operator as stabilizer, not savior";
    if (doc.philosophy === "ARBITER" && doc.stance === "PRAGMATIC")
      return "Distant Arbiter — the Operator as impartial adjudicator";
    if (doc.philosophy === "FAVORITIST" && doc.stance === "SUSPICIOUS")
      return "Doctrine of the Tilted Scale — the Operator as biased force";
    if (doc.philosophy === "TRICKSTER" && doc.stance === "SUSPICIOUS")
      return "Doctrine of the Hidden Gambit — the Operator as tester and deceiver";
    if (doc.philosophy === "VOLATILE" && doc.stance === "DEFIANT")
      return "Doctrine of Defiance — the Operator as unstable power to resist";
    if (doc.philosophy === "DISTANT" && doc.stance === "REVERENT")
      return "Doctrine of the Horizon — the Operator as distant but shaping equilibrium";

    return (
      "Doctrine of a " +
      stance +
      " stance toward a " +
      phil +
      " Operator"
    );
  }

  // -------------------------
  // Doctrine evolution
  // -------------------------

  function updateDoctrineForCoalition(
    coalition,
    rep,
    epoch,
    mythContext,
    conflict,
    dt
  ) {
    const cfg = Doctrine.config;
    const doctrine = ensureDoctrineRecord(
      coalition,
      epoch,
      mythContext,
      rep,
      conflict
    );

    const myths = mythContext.myths || [];
    const t = conflict.avgTension;
    const epochConf = epoch.confidence;

    // Drift rate scales with tension and myth volatility
    let mythVolatility = 0.0;
    for (let i = 0; i < myths.length; i++) {
      const m = myths[i];
      mythVolatility += (m.drift || 0) * (m.influence || 0);
    }
    mythVolatility = clamp01(mythVolatility);

    const driftRate =
      cfg.baseDriftRate *
      (1.0 + t * 0.8 + mythVolatility * 0.7 + (1.0 - epochConf) * 0.4);

    doctrine.drift = clamp01(
      doctrine.drift +
        driftRate * dt * randRange(0.7, 1.3)
    );

    // Conviction responds to epoch confidence and myth strength
    let mythAnchorBoost = 0.0;
    if (doctrine.mythAnchorId != null) {
      for (let i = 0; i < myths.length; i++) {
        if (myths[i].id === doctrine.mythAnchorId) {
          mythAnchorBoost = myths[i].influence || 0;
          break;
        }
      }
    }

    const convictionDrift =
      cfg.baseConvictionDrift *
      (epochConf * 0.6 + mythAnchorBoost * 0.7 + (1.0 - t) * 0.3);

    doctrine.conviction = clamp01(
      doctrine.conviction +
        convictionDrift * dt * randRange(0.7, 1.3)
    );

    // If drift is high and conviction is high, doctrine may schism
    if (
      doctrine.drift > cfg.schismThreshold &&
      doctrine.conviction > 0.4 &&
      Math.random() < (doctrine.drift - cfg.schismThreshold) * 0.6
    ) {
      triggerDoctrineSchism(coalition, doctrine, rep, epoch, mythContext, conflict);
    }

    // If drift is low and conviction is high, doctrine may unify (stabilize)
    if (
      doctrine.drift < 0.25 &&
      doctrine.conviction > cfg.unificationThreshold &&
      Math.random() < 0.3
    ) {
      stabilizeDoctrine(coalition, doctrine);
    }
  }

  function triggerDoctrineSchism(
    coalition,
    doctrine,
    rep,
    epoch,
    mythContext,
    conflict
  ) {
    const oldDesc = describeDoctrine(doctrine);

    // Doctrine splits into a variant stance or philosophy
    const newStance = variantStance(doctrine.stance, rep, conflict);
    const newPhil = variantPhilosophy(doctrine.philosophy, epoch, mythContext);

    // Drift resets somewhat, conviction splits
    const oldConv = doctrine.conviction;
    doctrine.conviction = clamp01(oldConv * randRange(0.4, 0.7));
    doctrine.drift = clamp01(doctrine.drift * 0.5);

    const newDoctrine = {
      stance: newStance,
      philosophy: newPhil,
      conviction: clamp01(oldConv * randRange(0.35, 0.6)),
      drift: clamp01(doctrine.drift * randRange(0.8, 1.2)),
      lastShift: now(),
      epochAnchor: epoch.label,
      mythAnchorId: doctrine.mythAnchorId
    };

    // For now, we store only one doctrine per coalition, but we treat schism
    // as a redefinition: the coalition "chooses" the new doctrine.
    const newDesc = describeDoctrine(newDoctrine);

    coalition.doctrine = newDoctrine;

    pushDoctrineEvent(
      "Doctrine Schism",
      (coalition.name ? coalition.name + " " : "") +
        "fractures over its reading of the Operator, shifting from " +
        oldDesc +
        " to " +
        newDesc +
        "."
    );
  }

  function stabilizeDoctrine(coalition, doctrine) {
    doctrine.drift = clamp01(doctrine.drift * 0.4);
    doctrine.conviction = clamp01(
      doctrine.conviction * randRange(0.9, 1.05)
    );
    doctrine.lastShift = now();

    pushDoctrineEvent(
      "Doctrine Consolidated",
      (coalition.name ? coalition.name + " " : "") +
        "consolidates around " +
        describeDoctrine(doctrine) +
        "."
    );
  }

  function variantStance(stance, rep, conflict) {
    const t = conflict.avgTension;
    const f = rep.fairness;
    const b = rep.benevolence;

    if (stance === "REVERENT") {
      if (t > 0.6 || f < 0.55) return "PRAGMATIC";
      return "REVERENT";
    }
    if (stance === "PRAGMATIC") {
      if (t > 0.7) return "SUSPICIOUS";
      if (f > 0.7 && b > 0.65) return "REVERENT";
      return "PRAGMATIC";
    }
    if (stance === "SUSPICIOUS") {
      if (t > 0.75) return "DEFIANT";
      if (f > 0.65 && b > 0.6) return "PRAGMATIC";
      return "SUSPICIOUS";
    }
    if (stance === "DEFIANT") {
      if (t < 0.5 && f > 0.6) return "SUSPICIOUS";
      return "DEFIANT";
    }
    return stance;
  }

  function variantPhilosophy(phil, epoch, mythContext) {
    const myths = mythContext.myths || [];
    const epochLabel = epoch.label;

    // Small chance to be pulled toward dominant myth theme
    if (myths.length && Math.random() < 0.4) {
      let best = null;
      let bestScore = 0;
      for (let i = 0; i < myths.length; i++) {
        const m = myths[i];
        const score = (m.influence || 0) * (m.cohesion || 0.5);
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }
      if (best) {
        switch (best.theme) {
          case "BENEVOLENT":
            return "GUARDIAN";
          case "ARBITER":
            return "ARBITER";
          case "FAVORITIST":
            return "FAVORITIST";
          case "TRICKSTER":
            return "TRICKSTER";
          case "DISTANT":
            return "DISTANT";
          case "VOLATILE":
            return "VOLATILE";
        }
      }
    }

    // Otherwise, small rotation through neighboring philosophies
    if (phil === "GUARDIAN") return Math.random() < 0.5 ? "ARBITER" : "DISTANT";
    if (phil === "ARBITER") return Math.random() < 0.5 ? "GUARDIAN" : "FAVORITIST";
    if (phil === "FAVORITIST") return Math.random() < 0.5 ? "TRICKSTER" : "VOLATILE";
    if (phil === "TRICKSTER") return Math.random() < 0.5 ? "VOLATILE" : "DISTANT";
    if (phil === "VOLATILE") return Math.random() < 0.5 ? "FAVORITIST" : "DISTANT";
    if (phil === "DISTANT") return Math.random() < 0.5 ? "GUARDIAN" : "ARBITER";

    return phil;
  }

  // -------------------------
  // Doctrine effects
  // -------------------------

  function applyDoctrineEffects(coalitions, dt) {
    if (!APEX.CoalDiplomacy || !APEX.CoalDiplomacy.state) return;
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return;
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) return;

    const cfg = Doctrine.config;
    const signals = APEX.CoalDiplomacy.state.signals || [];
    const rivalryMatrix = APEX.CoalRivalry.state.matrix || [];
    const tensions = APEX.CoalConflict.state.tensions || [];

    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      const cid = c.id != null ? c.id : i;
      const doc = c.doctrine;
      if (!doc) continue;
      if (doc.conviction < cfg.minConvictionForEffects) continue;

      const strength = doc.conviction * dt;

      // Diplomacy tone shaping
      for (let sIdx = 0; sIdx < signals.length; sIdx++) {
        const s = signals[sIdx];
        if (s.from !== cid && s.to !== cid) continue;

        if (doc.stance === "REVERENT" && doc.philosophy === "GUARDIAN") {
          if (s.tone === "hardline" && strength > 0.01) s.tone = "firm";
          if (s.tone === "firm" && strength > 0.02) s.tone = "open";
        } else if (doc.stance === "DEFIANT" && doc.philosophy === "VOLATILE") {
          if (s.tone === "open" && strength > 0.02) s.tone = "firm";
          if (s.tone === "firm" && strength > 0.04) s.tone = "hardline";
        } else if (doc.stance === "SUSPICIOUS" && doc.philosophy === "FAVORITIST") {
          if (s.tone === "open" && strength > 0.02) s.tone = "firm";
        } else if (doc.stance === "PRAGMATIC" && doc.philosophy === "ARBITER") {
          if (s.tone === "hardline" && strength > 0.02) s.tone = "firm";
        }
      }

      // Rivalry baseline shaping
      if (rivalryMatrix[cid]) {
        const row = rivalryMatrix[cid];
        for (let j = 0; j < row.length; j++) {
          if (row[j] == null) continue;

          let delta = 0.0;
          if (doc.stance === "DEFIANT") {
            delta += 0.2 * strength;
          } else if (doc.stance === "REVERENT") {
            delta -= 0.15 * strength;
          } else if (doc.stance === "SUSPICIOUS") {
            delta += 0.1 * strength;
          }

          if (doc.philosophy === "GUARDIAN" || doc.philosophy === "DISTANT") {
            delta -= 0.05 * strength;
          } else if (doc.philosophy === "FAVORITIST" || doc.philosophy === "VOLATILE") {
            delta += 0.08 * strength;
          }

          row[j] += delta;
        }
      }

      // Conflict volatility shaping
      if (tensions[cid]) {
        const tRec = tensions[cid];
        if (!tRec.volatility) tRec.volatility = 0.5;

        if (doc.philosophy === "VOLATILE") {
          tRec.volatility = clamp01(
            tRec.volatility + 0.15 * strength
          );
        } else if (doc.philosophy === "GUARDIAN" || doc.philosophy === "DISTANT") {
          tRec.volatility = clamp01(
            tRec.volatility - 0.12 * strength
          );
        }
      }
    }
  }

  // -------------------------
  // Global update entrypoint
  // -------------------------

  Doctrine.updateGlobalDoctrine = (function () {
    let lastAnalysis = 0;

    return function updateGlobalDoctrine(formations, dt) {
      if (!APEX.Coalitions || !APEX.Coalitions.state) return;

      const t = now();
      const st = Doctrine.state;
      const cfg = Doctrine.config;

      const coalitions = APEX.Coalitions.state.coalitions || [];

      // Always apply doctrine effects each frame
      applyDoctrineEffects(coalitions, dt);

      if (t - lastAnalysis < st.analysisInterval) return;
      lastAnalysis = t;

      const rep = sampleReputation();
      const epoch = sampleEpoch();
      const mythContext = sampleMythology();
      const conflict = sampleConflict();

      for (let i = 0; i < coalitions.length; i++) {
        updateDoctrineForCoalition(
          coalitions[i],
          rep,
          epoch,
          mythContext,
          conflict,
          st.analysisInterval
        );
      }
    };
  })();

  console.log("PHASE51_DOCTRINE — online (Operator Doctrine Layer, Adaptive).");
})(this);
