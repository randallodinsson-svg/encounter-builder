// phase52-operator-historiography.js
// APEXCORE v4.4 — Phase 52: Operator Historiography Layer (Global + Per-Coalition, Adaptive Revisionism)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});

  const Hist = (APEX.Historiography = APEX.Historiography || {});

  Hist.state = {
    lastUpdateTime: 0,
    analysisInterval: 15.0, // seconds between historiography passes
    globalChronicle: []     // shared world history
  };

  Hist.config = {
    maxGlobalEntries: 400,
    maxCoalitionEntries: 200,
    baseRevisionRate: 0.02,
    baseRecordRate: 0.04,
    minWeightForRevision: 0.2,
    revisionImpact: 0.35
  };

  function now() {
    return performance.now() / 1000;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function pushScenarioEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  // -------------------------
  // Sampling context
  // -------------------------

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

  function sampleDoctrines(coalitions) {
    const doctrines = [];
    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      if (!c.doctrine) continue;
      doctrines.push({
        coalition: c,
        doctrine: c.doctrine
      });
    }
    return doctrines;
  }

  function sampleConflict() {
    if (!APEX.CoalConflict || !APEX.CoalConflict.state) {
      return { avgTension: 0.5, maxTension: 0.5 };
    }
    const tensions = APEX.CoalConflict.state.tensions || [];
    if (!tensions.length) return { avgTension: 0.5, maxTension: 0.5 };

    let sum = 0;
    let max = 0;
    for (let i = 0; i < tensions.length; i++) {
      const lvl = tensions[i].level || 0;
      sum += lvl;
      if (lvl > max) max = lvl;
    }
    return {
      avgTension: clamp01(sum / tensions.length),
      maxTension: clamp01(max)
    };
  }

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

  // -------------------------
  // Coalition history structure
  // -------------------------
  // coalition.history = {
  //   timeline: [
  //     { time, type, label, interpretation, bias, weight, epoch, source }
  //   ],
  //   revisionism: 0..1,
  //   cohesion: 0..1,
  //   narrativeArc: "ASCENT" | "DECLINE" | "BETRAYAL" | "RENEWAL"
  // }

  function ensureCoalitionHistory(coalition, epoch) {
    if (!coalition.history) {
      coalition.history = {
        timeline: [],
        revisionism: randRange(0.2, 0.7),
        cohesion: randRange(0.4, 0.8),
        narrativeArc: pickInitialArc(epoch)
      };
    }
    return coalition.history;
  }

  function pickInitialArc(epoch) {
    const label = epoch.label || "ERA_DEFAULT";
    if (label.indexOf("ASCENT") !== -1) return "ASCENT";
    if (label.indexOf("DECLINE") !== -1) return "DECLINE";
    if (label.indexOf("BETRAYAL") !== -1) return "BETRAYAL";
    if (label.indexOf("RENEWAL") !== -1) return "RENEWAL";

    const r = Math.random();
    if (r < 0.25) return "ASCENT";
    if (r < 0.5) return "DECLINE";
    if (r < 0.75) return "BETRAYAL";
    return "RENEWAL";
  }

  function describeArc(arc) {
    switch (arc) {
      case "ASCENT":
        return "a rising arc — the Operator as catalyst of growth";
      case "DECLINE":
        return "a declining arc — the Operator as harbinger of erosion";
      case "BETRAYAL":
        return "a betrayal arc — the Operator as broken promise";
      case "RENEWAL":
        return "a renewal arc — the Operator as force of recovery";
    }
    return "an uncertain arc";
  }

  // -------------------------
  // Global chronicle helpers
  // -------------------------

  function addGlobalEntry(entry) {
    const st = Hist.state;
    const cfg = Hist.config;
    const chron = st.globalChronicle;

    chron.push(entry);
    if (chron.length > cfg.maxGlobalEntries) {
      chron.splice(0, chron.length - cfg.maxGlobalEntries);
    }
  }

  function recordGlobalEvent(type, label, epoch, weight, meta) {
    const entry = {
      time: now(),
      type,
      label,
      epoch: epoch.label,
      weight: clamp01(weight),
      meta: meta || {}
    };
    addGlobalEntry(entry);
    return entry;
  }

  // -------------------------
  // Coalition history recording
  // -------------------------

  function recordCoalitionEvent(coalition, type, label, interpretation, bias, weight, epoch, source) {
    const cfg = Hist.config;
    const history = ensureCoalitionHistory(coalition, epoch);

    const entry = {
      time: now(),
      type,
      label,
      interpretation,
      bias: clamp01(bias),
      weight: clamp01(weight),
      epoch: epoch.label,
      source: source || "WORLD"
    };

    history.timeline.push(entry);
    if (history.timeline.length > cfg.maxCoalitionEntries) {
      history.timeline.splice(0, history.timeline.length - cfg.maxCoalitionEntries);
    }

    return entry;
  }

  // -------------------------
  // Historical interpretation
  // -------------------------

  function interpretOperatorForCoalition(coalition, epoch, rep, conflict, doctrine, myths) {
    const name = coalition.name || "A coalition";
    const arc = coalition.history ? coalition.history.narrativeArc : "ASCENT";

    const t = conflict.avgTension;
    const maxT = conflict.maxTension;
    const f = rep.fairness;
    const b = rep.benevolence;
    const fav = rep.favoritism;

    let stance = doctrine ? doctrine.stance : "PRAGMATIC";
    let phil = doctrine ? doctrine.philosophy : "ARBITER";

    // Myth influence: pick most influential myth for this coalition if any
    let mythLabel = null;
    let mythTheme = null;
    if (myths && myths.length) {
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
      if (best && bestScore > 0.15) {
        mythLabel = best.label || null;
        mythTheme = best.theme || null;
      }
    }

    let interpretation;
    let bias = 0.5;
    let weight = 0.4;

    if (arc === "ASCENT") {
      if (stance === "REVERENT" && phil === "GUARDIAN") {
        interpretation = "The Operator is remembered as a quiet stabilizer of our ascent.";
        bias = 0.25;
        weight = 0.6;
      } else if (stance === "PRAGMATIC" && phil === "ARBITER") {
        interpretation = "The Operator is recorded as a distant but fair arbiter during our rise.";
        bias = 0.4;
        weight = 0.55;
      } else {
        interpretation = "The Operator is seen as one of many forces in our upward era.";
        bias = 0.45;
        weight = 0.45;
      }
    } else if (arc === "DECLINE") {
      if (stance === "SUSPICIOUS" || stance === "DEFIANT") {
        interpretation = "The Operator is cast as a catalyst of our decline.";
        bias = 0.75;
        weight = 0.65;
      } else {
        interpretation = "The Operator is ambiguously tied to our fading fortunes.";
        bias = 0.6;
        weight = 0.5;
      }
    } else if (arc === "BETRAYAL") {
      if (stance === "DEFIANT") {
        interpretation = "The Operator is chronicled as a betrayer of our early hopes.";
        bias = 0.8;
        weight = 0.7;
      } else if (stance === "SUSPICIOUS") {
        interpretation = "The Operator is remembered as an unreliable and shifting presence.";
        bias = 0.7;
        weight = 0.6;
      } else {
        interpretation = "The Operator is recorded as a figure of broken expectations.";
        bias = 0.65;
        weight = 0.55;
      }
    } else if (arc === "RENEWAL") {
      if (stance === "REVERENT" || stance === "PRAGMATIC") {
        interpretation = "The Operator is remembered as a catalyst of our renewal.";
        bias = 0.35;
        weight = 0.65;
      } else {
        interpretation = "The Operator is recorded as a complicated force in our recovery.";
        bias = 0.5;
        weight = 0.55;
      }
    }

    // Adjust bias and weight by conflict and reputation
    bias = clamp01(
      bias +
        (maxT - 0.5) * 0.25 -
        (f - 0.5) * 0.2 -
        (b - 0.5) * 0.2 +
        (fav - 0.5) * 0.15
    );

    weight = clamp01(
      weight +
        (Math.abs(maxT - 0.5) * 0.2) +
        (Math.abs(f - 0.5) * 0.1)
    );

    if (mythLabel && mythTheme) {
      interpretation +=
        " This period is framed through the myth of \"" +
        mythLabel +
        "\".";
      weight = clamp01(weight + 0.1);
    }

    return {
      label: name + " historical framing of the Operator.",
      interpretation,
      bias,
      weight
    };
  }

  // -------------------------
  // Narrative arc evolution
  // -------------------------

  function updateNarrativeArc(history, epoch, conflict, doctrine) {
    const t = conflict.avgTension;
    const maxT = conflict.maxTension;
    const epochLabel = epoch.label || "ERA_DEFAULT";

    let arc = history.narrativeArc;

    if (epochLabel.indexOf("RENEWAL") !== -1 && Math.random() < 0.25) {
      arc = "RENEWAL";
    } else if (epochLabel.indexOf("DECLINE") !== -1 && Math.random() < 0.25) {
      arc = "DECLINE";
    } else if (epochLabel.indexOf("BETRAYAL") !== -1 && Math.random() < 0.25) {
      arc = "BETRAYAL";
    } else {
      if (maxT > 0.75 && Math.random() < 0.3) {
        arc = "BETRAYAL";
      } else if (t > 0.65 && Math.random() < 0.3) {
        arc = "DECLINE";
      } else if (t < 0.4 && Math.random() < 0.25) {
        arc = "ASCENT";
      }
    }

    if (doctrine && doctrine.conviction > 0.7) {
      if (doctrine.stance === "REVERENT" && Math.random() < 0.3) {
        arc = "ASCENT";
      } else if (doctrine.stance === "DEFIANT" && Math.random() < 0.3) {
        arc = "BETRAYAL";
      }
    }

    history.narrativeArc = arc;
  }

  // -------------------------
  // Revisionism
  // -------------------------

  function applyRevisionismToCoalition(coalition, epoch, rep, conflict, myths) {
    const cfg = Hist.config;
    const history = coalition.history;
    if (!history) return;

    const timeline = history.timeline;
    if (!timeline.length) return;

    const rev = history.revisionism;
    const coh = history.cohesion;

    const mythVolatility = computeMythVolatility(myths);
    const tension = conflict.avgTension;
    const epochConf = epoch.confidence;

    const revisionRate =
      cfg.baseRevisionRate *
      (1.0 +
        rev * 0.8 +
        mythVolatility * 0.6 +
        tension * 0.5 +
        (1.0 - epochConf) * 0.4 +
        (1.0 - coh) * 0.5);

    if (Math.random() > revisionRate) return;

    // Pick a target entry with enough weight
    const candidates = [];
    for (let i = 0; i < timeline.length; i++) {
      const e = timeline[i];
      if (e.weight >= cfg.minWeightForRevision) {
        candidates.push(e);
      }
    }
    if (!candidates.length) return;

    const target = candidates[(Math.random() * candidates.length) | 0];
    const oldInterp = target.interpretation;

    // Flip or soften bias depending on current doctrine and arc
    const doctrine = coalition.doctrine || null;
    const arc = history.narrativeArc;

    let newBias = target.bias;
    let newInterp = oldInterp;

    if (arc === "BETRAYAL" && doctrine && doctrine.stance === "REVERENT") {
      // Softening betrayal narrative
      newBias = clamp01(target.bias - cfg.revisionImpact * randRange(0.4, 0.9));
      newInterp =
        "Earlier records of betrayal are now reframed as misinterpretation of the Operator's intent.";
    } else if (arc === "ASCENT" && doctrine && doctrine.stance === "DEFIANT") {
      // Hardening narrative against Operator
      newBias = clamp01(target.bias + cfg.revisionImpact * randRange(0.4, 0.9));
      newInterp =
        "Past cooperation is rewritten as reluctant necessity under an overbearing Operator.";
    } else {
      // General drift
      const dir = Math.random() < 0.5 ? -1 : 1;
      newBias = clamp01(target.bias + dir * cfg.revisionImpact * randRange(0.2, 0.6));
      newInterp =
        "Historical accounts are revised, reflecting a shifting view of the Operator's role.";
    }

    target.bias = newBias;
    target.interpretation = newInterp;
    target.epoch = epoch.label;

    pushScenarioEvent(
      "History Revised",
      (coalition.name ? coalition.name + " " : "") +
        "revises its chronicles, altering how it remembers the Operator."
    );
  }

  function computeMythVolatility(myths) {
    if (!myths || !myths.length) return 0.0;
    let vol = 0;
    for (let i = 0; i < myths.length; i++) {
      const m = myths[i];
      vol += (m.drift || 0) * (m.influence || 0);
    }
    return clamp01(vol);
  }

  // -------------------------
  // Global history alignment
  // -------------------------

  function alignCoalitionWithGlobal(coalition, epoch) {
    const history = coalition.history;
    if (!history) return;

    const chron = Hist.state.globalChronicle;
    if (!chron.length) return;

    // Small chance to align with global record if cohesion is high and revisionism low
    if (history.cohesion > 0.7 && history.revisionism < 0.4 && Math.random() < 0.2) {
      const anchor = chron[(Math.random() * chron.length) | 0];
      const entry = recordCoalitionEvent(
        coalition,
        "GLOBAL_ALIGNMENT",
        "Adoption of global chronicle segment.",
        "Our records now align with the world chronicle regarding " + anchor.label + ".",
        0.5,
        anchor.weight * 0.8,
        epoch,
        "GLOBAL"
      );

      pushScenarioEvent(
        "History Aligned",
        (coalition.name ? coalition.name + " " : "") +
          "aligns part of its history with the global chronicle."
      );

      return entry;
    }
  }

  // -------------------------
  // Global update
  // -------------------------

  Hist.updateGlobalHistory = (function () {
    let lastAnalysis = 0;

    return function updateGlobalHistory(formations, dt) {
      if (!APEX.Coalitions || !APEX.Coalitions.state) return;

      const t = now();
      const st = Hist.state;
      const cfg = Hist.config;

      const coalitions = APEX.Coalitions.state.coalitions || [];
      if (!coalitions.length) return;

      const epoch = sampleEpoch();
      const myths = sampleMythology().myths;
      const rep = sampleReputation();
      const conflict = sampleConflict();
      const doctrines = sampleDoctrines(coalitions);

      // Per-frame: small chance to record a global snapshot
      if (Math.random() < cfg.baseRecordRate * dt) {
        const label = "Epoch snapshot: " + epoch.label;
        const entry = recordGlobalEvent(
          "EPOCH_SNAPSHOT",
          label,
          epoch,
          0.5 + Math.abs(conflict.avgTension - 0.5) * 0.3,
          {
            avgTension: conflict.avgTension,
            maxTension: conflict.maxTension
          }
        );

        pushScenarioEvent(
          "World Chronicle",
          "The world chronicle records " + label + "."
        );
      }

      if (t - lastAnalysis < st.analysisInterval) return;
      lastAnalysis = t;

      // Coalition-level historiography
      for (let i = 0; i < coalitions.length; i++) {
        const c = coalitions[i];
        const history = ensureCoalitionHistory(c, epoch);

        // Update narrative arc
        updateNarrativeArc(history, epoch, conflict, c.doctrine || null);

        // Record a new interpretive entry about the Operator
        const interp = interpretOperatorForCoalition(
          c,
          epoch,
          rep,
          conflict,
          c.doctrine || null,
          myths
        );

        recordCoalitionEvent(
          c,
          "OPERATOR_INTERPRETATION",
          interp.label,
          interp.interpretation,
          interp.bias,
          interp.weight,
          epoch,
          "INTERNAL"
        );

        // Occasionally align with global history
        alignCoalitionWithGlobal(c, epoch);

        // Apply revisionism
        applyRevisionismToCoalition(c, epoch, rep, conflict, myths);
      }
    };
  })();

  console.log("PHASE52_HISTORIOGRAPHY — online (Operator Historiography Layer, Global + Per-Coalition, Adaptive).");
})(this);
