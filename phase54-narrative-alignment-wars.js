// phase54-narrative-alignment-wars.js
// APEXCORE v4.4 — Phase 54: Narrative Alignment Wars (Bloc Architecture)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Blocs = (APEX.NarrativeBlocs = APEX.NarrativeBlocs || {});

  Blocs.state = {
    blocs: [],
    lastUpdateTime: 0,
    lastRealignTime: 0,
    lastConflictCheck: 0,
    realignInterval: 28.0,
    conflictInterval: 19.0,
    maxBlocs: 5
  };

  Blocs.config = {
    minBlocs: 2,
    maxBlocs: 5,
    baseBlocFormationRate: 0.35,
    baseRealignRate: 0.25,
    baseConflictRate: 0.3,
    minFusionInfluenceForAnchor: 0.35,
    blocCohesionDrift: 0.04,
    blocAggressionDrift: 0.05,
    blocMaxMembers: 12
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

  function sampleFusions() {
    if (!APEX.HistFusion || !APEX.HistFusion.state) return [];
    return APEX.HistFusion.state.fusions || [];
  }

  function sampleCoalitions() {
    if (!APEX.Coalitions || !APEX.Coalitions.state) return [];
    return APEX.Coalitions.state.coalitions || [];
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

  function computeFusionField(fusions) {
    if (!fusions.length) return 0.0;
    let sum = 0;
    for (let i = 0; i < fusions.length; i++) {
      sum += fusions[i].influence || 0;
    }
    return clamp01(sum / fusions.length);
  }

  function computeBlocFormationPressure(fusions, conflict) {
    const fusionField = computeFusionField(fusions);
    const tension = conflict.avgTension;
    const maxT = conflict.maxTension;

    let pressure =
      Blocs.config.baseBlocFormationRate *
      (1.0 +
        fusionField * 0.7 +
        tension * 0.5 +
        maxT * 0.4);

    return clamp01(pressure);
  }

  function computeBlocConflictPressure(blocs, conflict) {
    if (!blocs.length) return 0.0;
    const tension = conflict.avgTension;
    const maxT = conflict.maxTension;

    let avgAgg = 0;
    for (let i = 0; i < blocs.length; i++) {
      avgAgg += blocs[i].narrativeAggression || 0;
    }
    avgAgg = clamp01(avgAgg / blocs.length);

    let pressure =
      Blocs.config.baseConflictRate *
      (1.0 +
        avgAgg * 0.7 +
        tension * 0.5 +
        maxT * 0.4);

    return clamp01(pressure);
  }

  function pickFusionAnchors(fusions) {
    const anchors = [];
    for (let i = 0; i < fusions.length; i++) {
      const f = fusions[i];
      if ((f.influence || 0) < Blocs.config.minFusionInfluenceForAnchor) continue;
      if (Math.random() < 0.4) anchors.push(f);
    }
    return anchors;
  }

  function labelBloc(anchorFusion, index) {
    const baseNames = [
      "Axis",
      "Concord",
      "Pact",
      "Front",
      "Assembly",
      "Circle",
      "Order",
      "Compact"
    ];
    const base = baseNames[(Math.random() * baseNames.length) | 0];

    const fusionLabel = anchorFusion ? anchorFusion.label || "Cycle" : "Cycle";
    const shortFusion = fusionLabel.split("(")[0].trim();

    return base + " of " + shortFusion + " #" + (index + 1);
  }

  function createBloc(anchorFusion, index) {
    const epoch = anchorFusion ? anchorFusion.epochContext || "ERA_DEFAULT" : "ERA_DEFAULT";

    const cohesion = clamp01(
      0.5 +
        (anchorFusion ? (anchorFusion.cohesion || 0) * 0.3 : 0) +
        randRange(-0.15, 0.15)
    );

    const aggression = clamp01(
      0.4 +
        (anchorFusion ? (anchorFusion.drift || 0) * 0.3 : 0) +
        randRange(-0.2, 0.2)
    );

    return {
      id: "BLOC_" + Date.now().toString(36) + "_" + ((Math.random() * 1e6) | 0),
      label: labelBloc(anchorFusion, index),
      epochContext: epoch,
      anchorFusionLabel: anchorFusion ? anchorFusion.label : null,
      anchorFusionInfluence: anchorFusion ? anchorFusion.influence || 0 : 0,
      cohesion,
      narrativeAggression: aggression,
      members: [],
      hostility: {}, // blocId -> hostility 0..1
      lastNarrativePush: now()
    };
  }

  function ensureBlocsExist(fusions, conflict) {
    const st = Blocs.state;
    const cfg = Blocs.config;

    if (st.blocs.length >= cfg.minBlocs) return;

    const anchors = pickFusionAnchors(fusions);
    const needed = Math.max(cfg.minBlocs - st.blocs.length, 0);
    for (let i = 0; i < needed; i++) {
      const anchor = anchors.length
        ? anchors[(Math.random() * anchors.length) | 0]
        : null;
      const bloc = createBloc(anchor, st.blocs.length);
      st.blocs.push(bloc);

      pushScenarioEvent(
        "Narrative Bloc Formed",
        "A new narrative bloc emerges: " + bloc.label + "."
      );
    }
  }

  function assignCoalitionsToBlocs(coalitions, fusions) {
    const st = Blocs.state;
    const cfg = Blocs.config;
    const blocs = st.blocs;

    if (!blocs.length || !coalitions.length) return;

    for (let i = 0; i < blocs.length; i++) {
      blocs[i].members = [];
    }

    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      if (!c) continue;

      if (!c.narrativeAlignment) {
        c.narrativeAlignment = {
          fusionAlignment: 0.5,
          narrativeAggression: randRange(0.3, 0.7),
          targetFusions: [],
          hostilityMap: {},
          blocId: null
        };
      }

      let bestBloc = null;
      let bestScore = -Infinity;

      for (let j = 0; j < blocs.length; j++) {
        const b = blocs[j];

        let score = 0;

        if (b.anchorFusionLabel && c.fusionState && c.fusionState.exposure != null) {
          score += c.fusionState.exposure * 0.4;
        }

        if (c.doctrine && c.doctrine.conviction != null) {
          score += c.doctrine.conviction * 0.3;
        }

        if (c.identity && c.identity.cohesion != null) {
          score += c.identity.cohesion * 0.2;
        }

        score += randRange(-0.1, 0.1);

        if (score > bestScore) {
          bestScore = score;
          bestBloc = b;
        }
      }

      if (bestBloc) {
        bestBloc.members.push(c);
        c.narrativeAlignment.blocId = bestBloc.id;
      }
    }

    for (let i = 0; i < blocs.length; i++) {
      const b = blocs[i];
      if (b.members.length > cfg.blocMaxMembers) {
        b.members = b.members.slice(0, cfg.blocMaxMembers);
      }
    }
  }

  function driftBlocState(bloc, fusions, conflict) {
    const cfg = Blocs.config;

    const fusionField = computeFusionField(fusions);
    const tension = conflict.avgTension;

    const cohesionDrift =
      cfg.blocCohesionDrift *
      (1.0 +
        fusionField * 0.4 -
        tension * 0.2);

    const aggressionDrift =
      cfg.blocAggressionDrift *
      (1.0 +
        tension * 0.6 +
        fusionField * 0.3);

    if (Math.random() < cohesionDrift) {
      bloc.cohesion = clamp01(
        bloc.cohesion + randRange(-0.08, 0.08)
      );
    }

    if (Math.random() < aggressionDrift) {
      bloc.narrativeAggression = clamp01(
        bloc.narrativeAggression + randRange(-0.1, 0.1)
      );
    }

    if (bloc.cohesion < 0.25 && Math.random() < 0.25) {
      pushScenarioEvent(
        "Bloc Fracture Risk",
        "Narrative cohesion within " + bloc.label + " is destabilizing."
      );
    }
  }

  function updateBlocHostility(blocs) {
    for (let i = 0; i < blocs.length; i++) {
      const a = blocs[i];
      if (!a.hostility) a.hostility = {};

      for (let j = 0; j < blocs.length; j++) {
        if (i === j) continue;
        const b = blocs[j];

        const key = b.id;
        if (a.hostility[key] == null) {
          a.hostility[key] = randRange(0.2, 0.6);
        }

        let delta = 0;

        const anchorMismatch =
          a.anchorFusionLabel && b.anchorFusionLabel &&
          a.anchorFusionLabel !== b.anchorFusionLabel;

        if (anchorMismatch) delta += 0.05;

        const aggressionFactor =
          (a.narrativeAggression || 0) * 0.03 +
          (b.narrativeAggression || 0) * 0.03;

        delta += aggressionFactor;

        delta += randRange(-0.03, 0.03);

        a.hostility[key] = clamp01(a.hostility[key] + delta);
      }
    }
  }

  function pickBlocConflictPair(blocs) {
    let bestPair = null;
    let bestScore = 0;

    for (let i = 0; i < blocs.length; i++) {
      const a = blocs[i];
      for (let j = i + 1; j < blocs.length; j++) {
        const b = blocs[j];

        const hAB = (a.hostility && a.hostility[b.id]) || 0.0;
        const hBA = (b.hostility && b.hostility[a.id]) || 0.0;

        const score =
          hAB * 0.5 +
          hBA * 0.5 +
          (a.narrativeAggression || 0) * 0.3 +
          (b.narrativeAggression || 0) * 0.3;

        if (score > bestScore) {
          bestScore = score;
          bestPair = { a, b, score };
        }
      }
    }

    if (!bestPair || bestScore < 0.4) return null;
    return bestPair;
  }

  function applyBlocConflict(pair, fusions, conflict) {
    const a = pair.a;
    const b = pair.b;

    const severity =
      clamp01(pair.score * 0.7 + conflict.avgTension * 0.3) *
      randRange(0.6, 1.1);

    if (a.hostility && a.hostility[b.id] != null) {
      a.hostility[b.id] = clamp01(a.hostility[b.id] + randRange(0.05, 0.15));
    }
    if (b.hostility && b.hostility[a.id] != null) {
      b.hostility[a.id] = clamp01(b.hostility[a.id] + randRange(0.05, 0.15));
    }

    a.cohesion = clamp01(a.cohesion + randRange(-0.08, 0.04));
    b.cohesion = clamp01(b.cohesion + randRange(-0.08, 0.04));

    const label =
      severity > 0.75
        ? "Narrative War"
        : severity > 0.5
        ? "Narrative Clash"
        : "Narrative Skirmish";

    const fusionRef =
      a.anchorFusionLabel && b.anchorFusionLabel &&
      a.anchorFusionLabel === b.anchorFusionLabel
        ? a.anchorFusionLabel
        : a.anchorFusionLabel || b.anchorFusionLabel || "contested myth-history";

    pushScenarioEvent(
      label,
      a.label +
        " and " +
        b.label +
        " enter into open narrative conflict over " +
        fusionRef +
        "."
    );

    if (severity > 0.8 && Math.random() < 0.3) {
      const target = a.cohesion < b.cohesion ? a : b;
      pushScenarioEvent(
        "Bloc Schism",
        "A schism emerges within " +
          target.label +
          " as factions contest its myth-historical alignment."
      );
    }
  }

  function realignBlocs(blocs, fusions) {
    if (!blocs.length || !fusions.length) return;

    for (let i = 0; i < blocs.length; i++) {
      const b = blocs[i];

      if (!b.anchorFusionLabel || Math.random() < 0.25) {
        const anchors = pickFusionAnchors(fusions);
        if (!anchors.length) continue;
        const anchor = anchors[(Math.random() * anchors.length) | 0];

        b.anchorFusionLabel = anchor.label;
        b.anchorFusionInfluence = anchor.influence || 0;
        b.epochContext = anchor.epochContext || b.epochContext;

        pushScenarioEvent(
          "Bloc Realignment",
          b.label +
            " realigns its narrative around the cycle: " +
            anchor.label +
            "."
        );
      }
    }
  }

  function updateCoalitionNarrativeAlignment(coalitions, blocs) {
    if (!coalitions.length || !blocs.length) return;

    for (let i = 0; i < coalitions.length; i++) {
      const c = coalitions[i];
      if (!c || !c.narrativeAlignment) continue;

      const bloc = blocs.find(b => b.id === c.narrativeAlignment.blocId);
      if (!bloc) continue;

      const targetFusionAlignment =
        bloc.anchorFusionInfluence != null
          ? clamp01(0.5 + bloc.anchorFusionInfluence * 0.4)
          : 0.5;

      c.narrativeAlignment.fusionAlignment = clamp01(
        c.narrativeAlignment.fusionAlignment +
          (targetFusionAlignment - c.narrativeAlignment.fusionAlignment) *
            randRange(0.05, 0.18)
      );

      const targetAgg =
        0.5 * (c.narrativeAlignment.narrativeAggression || 0.5) +
        0.5 * (bloc.narrativeAggression || 0.5);

      c.narrativeAlignment.narrativeAggression = clamp01(
        c.narrativeAlignment.narrativeAggression +
          (targetAgg - c.narrativeAlignment.narrativeAggression) *
            randRange(0.05, 0.15)
      );

      if (c.doctrine && c.doctrine.conviction != null) {
        c.doctrine.conviction = clamp01(
          c.doctrine.conviction +
            (c.narrativeAlignment.fusionAlignment - 0.5) * 0.04
        );
      }

      if (c.identity && c.identity.cohesion != null) {
        c.identity.cohesion = clamp01(
          c.identity.cohesion +
            (bloc.cohesion - 0.5) * 0.03
        );
      }
    }
  }

  Blocs.updateGlobalNarrativeBlocs = (function () {
    let lastUpdate = 0;

    return function updateGlobalNarrativeBlocs(formations, dt) {
      const t = now();
      const st = Blocs.state;
      const cfg = Blocs.config;

      const fusions = sampleFusions();
      const coalitions = sampleCoalitions();
      const conflict = sampleConflict();

      if (t - lastUpdate < 1.0) return;
      lastUpdate = t;

      ensureBlocsExist(fusions, conflict);
      assignCoalitionsToBlocs(coalitions, fusions);

      for (let i = 0; i < st.blocs.length; i++) {
        driftBlocState(st.blocs[i], fusions, conflict);
      }

      updateBlocHostility(st.blocs);
      updateCoalitionNarrativeAlignment(coalitions, st.blocs);

      if (t - st.lastRealignTime > st.realignInterval) {
        st.lastRealignTime = t;
        if (Math.random() < cfg.baseRealignRate) {
          realignBlocs(st.blocs, fusions);
        }
      }

      if (t - st.lastConflictCheck > st.conflictInterval) {
        st.lastConflictCheck = t;
        const pressure = computeBlocConflictPressure(st.blocs, conflict);
        if (Math.random() < pressure) {
          const pair = pickBlocConflictPair(st.blocs);
          if (pair) applyBlocConflict(pair, fusions, conflict);
        }
      }
    };
  })();

  console.log("PHASE54_NARRATIVE_BLOCS — online (Narrative Alignment Wars, Bloc Architecture).");
})(this);
