// phase50-operator-mythology.js
// APEXCORE v4.4 — Phase 50: Operator Mythology (Adaptive Myths)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});

  const Myth = (APEX.Mythology = APEX.Mythology || {});

  Myth.state = {
    myths: [],          // active myths
    nextId: 1,
    lastUpdateTime: 0
  };

  Myth.config = {
    analysisInterval: 10.0,     // seconds between major myth updates
    maxMyths: 24,               // global cap
    baseDriftRate: 0.02,        // how fast myths drift
    baseDecayRate: 0.01,        // how fast weak myths fade
    splitThreshold: 0.78,       // when internal tension causes schism
    mergeThreshold: 0.82,       // when myths converge
    minInfluenceForEffects: 0.15
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

  function pushMythEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  // -------------------------
  // Sampling operator context
  // -------------------------

  function sampleOperatorReputation() {
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

  function samplePresence() {
    if (!APEX.OperatorPresence || !APEX.OperatorPresence.state) {
      return { mode: "UNKNOWN", intensity: 0.0 };
    }
    const st = APEX.OperatorPresence.state;
    return {
      mode: st.globalMode || "UNKNOWN",
      intensity: clamp01(st.globalIntensity || 0.0)
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
  // Myth structure
  // -------------------------
  // A myth:
  // {
  //   id,
  //   label,
  //   theme,          // "BENEVOLENT", "ARBITER", "FAVORITIST", "TRICKSTER", "DISTANT", "VOLATILE"
  //   stance,         // "REVERENT", "SUSPICIOUS", "PRAGMATIC", "DEFIANT"
  //   influence,      // 0..1
  //   cohesion,       // 0..1 (internal agreement)
  //   drift,          // 0..1 (how unstable the narrative is)
  //   epochAnchor,    // epoch label it formed under
  //   createdAt,
  //   lastUpdate,
  //   coalitionBiases: { coalitionId -> affinity (-1..1) }
  // }

  function createMyth(theme, stance, epochLabel, baseInfluence) {
    const st = Myth.state;
    const id = st.nextId++;

    const myth = {
      id,
      label: buildMythLabel(theme, stance),
      theme,
      stance,
      influence: clamp01(baseInfluence + randRange(-0.05, 0.05)),
      cohesion: clamp01(0.5 + randRange(-0.1, 0.1)),
      drift: clamp01(0.3 + randRange(-0.15, 0.15)),
      epochAnchor: epochLabel,
      createdAt: now(),
      lastUpdate: now(),
      coalitionBiases: {}
    };

    st.myths.push(myth);
    announceMythBirth(myth);
    return myth;
  }

  function buildMythLabel(theme, stance) {
    if (theme === "BENEVOLENT" && stance === "REVERENT") return "The Quiet Guardian";
    if (theme === "BENEVOLENT" && stance === "PRAGMATIC") return "The Measured Hand";
    if (theme === "ARBITER" && stance === "PRAGMATIC") return "The Distant Arbiter";
    if (theme === "FAVORITIST" && stance === "SUSPICIOUS") return "The Chosen Scale";
    if (theme === "TRICKSTER" && stance === "SUSPICIOUS") return "The Hidden Gambit";
    if (theme === "VOLATILE" && stance === "DEFIANT") return "The Unsteady Sky";
    if (theme === "DISTANT" && stance === "REVERENT") return "The Silent Horizon";
    return "The Unnamed Pattern";
  }

  function announceMythBirth(myth) {
    const line =
      "A new story circulates: \"" +
      myth.label +
      "\", casting the Operator as " +
      describeTheme(myth.theme, myth.stance) +
      ".";
    pushMythEvent("Myth Emerges", line);
  }

  function describeTheme(theme, stance) {
    if (theme === "BENEVOLENT" && stance === "REVERENT")
      return "a quiet guardian whose guidance is subtle but intentional";
    if (theme === "BENEVOLENT" && stance === "PRAGMATIC")
      return "a measured force, neither savior nor tyrant, but a stabilizing hand";
    if (theme === "ARBITER" && stance === "PRAGMATIC")
      return "an impartial arbiter, weighing outcomes beyond any single coalition";
    if (theme === "FAVORITIST" && stance === "SUSPICIOUS")
      return "a biased presence, tilting the field toward favored formations";
    if (theme === "TRICKSTER" && stance === "SUSPICIOUS")
      return "an unpredictable actor, whose moves are read as tests or traps";
    if (theme === "VOLATILE" && stance === "DEFIANT")
      return "a volatile force to be resisted rather than appeased";
    if (theme === "DISTANT" && stance === "REVERENT")
      return "a distant horizon, shaping balance without direct command";
    return "a presence that resists any single story";
  }

  // -------------------------
  // Myth formation logic
  // -------------------------

  function maybeSpawnMyth(rep, epoch, presence, conflict) {
    const st = Myth.state;
    const cfg = Myth.config;

    if (st.myths.length >= cfg.maxMyths) return;

    const tension = conflict.avgTension;
    const intensity = presence.intensity;
    const epochConf = epoch.confidence;

    // Spawn probability scales with:
    // - higher tension
    // - higher presence intensity
    // - higher epoch confidence
    const spawnChance =
      0.05 +
      tension * 0.25 +
      intensity * 0.2 +
      epochConf * 0.2;

    if (Math.random() > spawnChance) return;

    const theme = pickTheme(rep, epoch, presence, conflict);
    const stance = pickStance(rep, epoch, presence, conflict, theme);
    const baseInfluence = 0.2 + tension * 0.2 + epochConf * 0.2;

    createMyth(theme, stance, epoch.label, baseInfluence);
  }

  function pickTheme(rep, epoch, presence, conflict) {
    const f = rep.fairness;
    const b = rep.benevolence;
    const fav = rep.favoritism;
    const t = conflict.avgTension;
    const inten = presence.intensity;
    const epochLabel = epoch.label;

    if (f > 0.65 && b > 0.65 && fav < 0.45 && t < 0.45) return "BENEVOLENT";
    if (fav > 0.7 && f < 0.55) return "FAVORITIST";
    if (t > 0.7 && inten > 0.4) return "VOLATILE";
    if (epochLabel === "ERA_UNSEEN_PATTERNS") return "TRICKSTER";
    if (epochLabel === "ERA_DISTANT_EQUILIBRIUM") return "DISTANT";
    return "ARBITER";
  }

  function pickStance(rep, epoch, presence, conflict, theme) {
    const f = rep.fairness;
    const b = rep.benevolence;
    const fav = rep.favoritism;
    const t = conflict.avgTension;

    if (theme === "BENEVOLENT") {
      if (f > 0.7 && b > 0.7) return "REVERENT";
      return "PRAGMATIC";
    }
    if (theme === "ARBITER") {
      if (f > 0.6 && b > 0.5 && t < 0.6) return "PRAGMATIC";
      return "SUSPICIOUS";
    }
    if (theme === "FAVORITIST") {
      return "SUSPICIOUS";
    }
    if (theme === "TRICKSTER") {
      return "SUSPICIOUS";
    }
    if (theme === "VOLATILE") {
      if (t > 0.7) return "DEFIANT";
      return "SUSPICIOUS";
    }
    if (theme === "DISTANT") {
      if (f > 0.6 && t < 0.5) return "REVERENT";
      return "PRAGMATIC";
    }
    return "PRAGMATIC";
  }

  // -------------------------
  // Myth drift, decay, split, merge
  // -------------------------

  function updateMyths(rep, epoch, presence, conflict, dt) {
    const st = Myth.state;
    const cfg = Myth.config;
    const myths = st.myths;

    const tension = conflict.avgTension;
    const inten = presence.intensity;

    const driftRate = cfg.baseDriftRate * (1.0 + tension * 0.8 + inten * 0.6);
    const decayRate = cfg.baseDecayRate * (1.0 + (1.0 - tension) * 0.5);

    // Drift & decay
    for (let i = myths.length - 1; i >= 0; i--) {
      const m = myths[i];

      m.lastUpdate = now();

      // Influence decays slightly if low cohesion or low tension
      const cohesionFactor = m.cohesion;
      const decay = decayRate * dt * (1.0 - cohesionFactor * 0.5);
      m.influence = clamp01(m.influence - decay);

      // Drift increases with tension and presence
      const driftDelta = driftRate * dt * randRange(0.5, 1.5);
      m.drift = clamp01(m.drift + driftDelta * (tension * 0.7 + inten * 0.3));

      // Cohesion responds to epoch confidence
      const epochConf = epoch.confidence;
      m.cohesion = clamp01(
        m.cohesion * (1.0 - 0.1 * dt) + epochConf * 0.1 * dt
      );

      // Remove dead myths
      if (m.influence < 0.03) {
        pushMythEvent(
          "Myth Fades",
          "The story of \"" +
            m.label +
            "\" loses its hold; few still speak of it with conviction."
        );
        myths.splice(i, 1);
      }
    }

    // Split & merge
    handleMythSplits(myths, rep, epoch, presence, conflict);
    handleMythMerges(myths);
  }

  function handleMythSplits(myths, rep, epoch, presence, conflict) {
    const cfg = Myth.config;
    if (myths.length >= cfg.maxMyths) return;

    for (let i = 0; i < myths.length; i++) {
      const m = myths[i];
      if (m.drift < cfg.splitThreshold) continue;
      if (m.influence < 0.2) continue;

      // Chance of split scales with drift and influence
      const chance = (m.drift - cfg.splitThreshold) * 0.8 + m.influence * 0.3;
      if (Math.random() > chance) continue;

      // Create a variant myth with slightly altered stance or theme
      const newTheme = maybeVariantTheme(m.theme, rep, epoch, presence, conflict);
      const newStance = maybeVariantStance(m.stance, newTheme, rep, epoch, presence, conflict);

      const childInfluence = m.influence * randRange(0.35, 0.6);
      m.influence *= randRange(0.4, 0.7);
      m.drift = clamp01(m.drift * 0.5);

      const child = createMyth(newTheme, newStance, epoch.label, childInfluence);
      child.cohesion = clamp01(m.cohesion * randRange(0.7, 1.0));
      child.drift = clamp01(m.drift * randRange(0.8, 1.2));

      pushMythEvent(
        "Myth Schism",
        "Debate over \"" +
          m.label +
          "\" fractures into a new reading: \"" +
          child.label +
          "\"."
      );

      if (myths.length >= cfg.maxMyths) return;
    }
  }

  function maybeVariantTheme(theme, rep, epoch, presence, conflict) {
    // Small chance to flip to a neighboring theme
    if (Math.random() > 0.4) return theme;

    if (theme === "BENEVOLENT") return "ARBITER";
    if (theme === "ARBITER") return Math.random() < 0.5 ? "BENEVOLENT" : "FAVORITIST";
    if (theme === "FAVORITIST") return "TRICKSTER";
    if (theme === "TRICKSTER") return "VOLATILE";
    if (theme === "VOLATILE") return "DISTANT";
    if (theme === "DISTANT") return "ARBITER";
    return theme;
  }

  function maybeVariantStance(stance, theme, rep, epoch, presence, conflict) {
    if (Math.random() > 0.5) return stance;

    if (stance === "REVERENT") return "PRAGMATIC";
    if (stance === "PRAGMATIC") return Math.random() < 0.5 ? "SUSPICIOUS" : "REVERENT";
    if (stance === "SUSPICIOUS") return Math.random() < 0.5 ? "PRAGMATIC" : "DEFIANT";
    if (stance === "DEFIANT") return "SUSPICIOUS";
    return stance;
  }

  function handleMythMerges(myths) {
    const cfg = Myth.config;
    if (myths.length < 2) return;

    for (let i = myths.length - 1; i >= 0; i--) {
      const a = myths[i];
      for (let j = i - 1; j >= 0; j--) {
        const b = myths[j];

        const similarity = mythSimilarity(a, b);
        if (similarity < cfg.mergeThreshold) continue;

        // Merge b into a
        const totalInfluence = a.influence + b.influence || 1.0;
        const wA = a.influence / totalInfluence;
        const wB = b.influence / totalInfluence;

        a.influence = clamp01(totalInfluence * 0.85);
        a.cohesion = clamp01(a.cohesion * wA + b.cohesion * wB);
        a.drift = clamp01((a.drift * wA + b.drift * wB) * 0.7);

        // Keep theme/stance of the stronger myth
        if (b.influence > a.influence) {
          a.theme = b.theme;
          a.stance = b.stance;
          a.label = b.label;
        }

        myths.splice(j, 1);

        pushMythEvent(
          "Myth Convergence",
          "Competing readings of the Operator settle into a shared story: \"" +
            a.label +
            "\"."
        );

        if (myths.length < 2) return;
      }
    }
  }

  function mythSimilarity(a, b) {
    let score = 0.0;
    if (a.theme === b.theme) score += 0.4;
    if (a.stance === b.stance) score += 0.3;

    const infDiff = Math.abs(a.influence - b.influence);
    score += (1.0 - infDiff) * 0.2;

    const cohDiff = Math.abs(a.cohesion - b.cohesion);
    score += (1.0 - cohDiff) * 0.1;

    return clamp01(score);
  }

  // -------------------------
  // Coalition-level influence
  // -------------------------

  function applyMythInfluenceToCoalitions(formations, dt) {
    if (!APEX.Coalitions || !APEX.Coalitions.state) return;
    if (!APEX.CoalRivalry || !APEX.CoalRivalry.state) return;
    if (!APEX.CoalDiplomacy || !APEX.CoalDiplomacy.state) return;
    if (!APEX.CoalIdentity || !APEX.CoalIdentity.state) return;

    const cfg = Myth.config;
    const myths = Myth.state.myths;
    if (!myths.length) return;

    const coalitions = APEX.Coalitions.state.coalitions || [];
    const rivalryMatrix = APEX.CoalRivalry.state.matrix || [];
    const signals = APEX.CoalDiplomacy.state.signals || [];
    const identities = APEX.CoalIdentity.state.identities || [];

    for (let mIdx = 0; mIdx < myths.length; mIdx++) {
      const myth = myths[mIdx];
      if (myth.influence < cfg.minInfluenceForEffects) continue;

      for (let cIdx = 0; cIdx < coalitions.length; cIdx++) {
        const c = coalitions[cIdx];
        const cid = c.id != null ? c.id : cIdx;

        const affinity = getCoalitionAffinityForMyth(myth, cid, c);
        if (Math.abs(affinity) < 0.05) continue;

        applyMythToCoalition(
          myth,
          affinity,
          cid,
          coalitions,
          rivalryMatrix,
          signals,
          identities,
          dt
        );
      }
    }
  }

  function getCoalitionAffinityForMyth(myth, coalitionId, coalition) {
    if (!myth.coalitionBiases[coalitionId]) {
      // Initialize affinity based on stance & theme vs coalition traits (if any)
      let base = 0.0;

      if (coalition && coalition.traits) {
        const traits = coalition.traits;
        if (traits.stability && myth.theme === "BENEVOLENT") base += 0.2;
        if (traits.ambition && myth.theme === "FAVORITIST") base += 0.2;
        if (traits.cautious && myth.theme === "TRICKSTER") base -= 0.1;
        if (traits.pride && myth.stance === "DEFIANT") base += 0.15;
      }

      if (myth.stance === "REVERENT") base += 0.1;
      if (myth.stance === "DEFIANT") base -= 0.05;

      myth.coalitionBiases[coalitionId] = clamp01(0.5 + base) * 2 - 1; // map to [-1,1]
    }

    return myth.coalitionBiases[coalitionId];
  }

  function applyMythToCoalition(
    myth,
    affinity,
    coalitionId,
    coalitions,
    rivalryMatrix,
    signals,
    identities,
    dt
  ) {
    const influenceScale = myth.influence * affinity * dt;

    // Rivalry: myths of favoritism or volatility increase rivalry;
    // benevolent / distant myths can soften rivalry.
    if (rivalryMatrix[coalitionId]) {
      const row = rivalryMatrix[coalitionId];
      for (let j = 0; j < row.length; j++) {
        if (row[j] == null) continue;

        let delta = 0.0;
        if (myth.theme === "FAVORITIST" || myth.theme === "VOLATILE") {
          delta = 0.25 * influenceScale;
        } else if (myth.theme === "BENEVOLENT" || myth.theme === "DISTANT") {
          delta = -0.2 * influenceScale;
        } else if (myth.theme === "TRICKSTER") {
          delta = 0.15 * influenceScale;
        } else if (myth.theme === "ARBITER") {
          delta = -0.1 * influenceScale;
        }

        row[j] += delta;
      }
    }

    // Diplomacy: myths shape tone preferences
    for (let i = 0; i < signals.length; i++) {
      const s = signals[i];
      if (s.from !== coalitionId && s.to !== coalitionId) continue;

      if (myth.stance === "REVERENT" && myth.theme === "BENEVOLENT") {
        if (s.tone === "hardline" && influenceScale > 0) s.tone = "firm";
        if (s.tone === "firm" && influenceScale > 0.02) s.tone = "open";
      } else if (myth.stance === "DEFIANT" || myth.theme === "VOLATILE") {
        if (s.tone === "open" && influenceScale > 0.02) s.tone = "firm";
        if (s.tone === "firm" && influenceScale > 0.05) s.tone = "hardline";
      }
    }

    // Identity: myths nudge how coalitions describe themselves
    const idRec = identities[coalitionId];
    if (idRec) {
      if (!idRec.mythicLean) idRec.mythicLean = 0.0;
      idRec.mythicLean = clamp01(
        idRec.mythicLean + influenceScale * 0.3
      );
    }
  }

  // -------------------------
  // Global update entrypoint
  // -------------------------

  Myth.updateGlobalMythology = (function () {
    let lastAnalysis = 0;

    return function updateGlobalMythology(formations, dt) {
      const t = now();
      const cfg = Myth.config;

      if (t - lastAnalysis < cfg.analysisInterval) {
        // Even between major analyses, myths still influence coalitions
        applyMythInfluenceToCoalitions(formations, dt);
        return;
      }

      lastAnalysis = t;

      const rep = sampleOperatorReputation();
      const epoch = sampleEpoch();
      const presence = samplePresence();
      const conflict = sampleConflict();

      maybeSpawnMyth(rep, epoch, presence, conflict);
      updateMyths(rep, epoch, presence, conflict, cfg.analysisInterval);

      applyMythInfluenceToCoalitions(formations, dt);
    };
  })();

  console.log("PHASE50_MYTHOLOGY — online (Adaptive Operator Myths).");
})(this);
