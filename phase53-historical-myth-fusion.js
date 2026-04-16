// phase53-historical-myth-fusion.js
// APEXCORE v4.4 — Phase 53: Historical Myth Fusion Layer (Adaptive)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Fusion = (APEX.HistFusion = APEX.HistFusion || {});

  Fusion.state = {
    lastUpdateTime: 0,
    fusionInterval: 22.0,
    fusions: [] // global registry of myth-historical fusion narratives
  };

  Fusion.config = {
    maxFusions: 120,
    baseFusionRate: 0.04,
    baseDriftRate: 0.03,
    minInfluenceForImpact: 0.25
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

  function sampleEpoch() {
    if (!APEX.Epoch || !APEX.Epoch.state) {
      return { label: "ERA_DEFAULT", confidence: 0.0 };
    }
    return {
      label: APEX.Epoch.state.current || "ERA_DEFAULT",
      confidence: APEX.Epoch.state.confidence || 0.0
    };
  }

  function sampleMyths() {
    if (!APEX.Mythology || !APEX.Mythology.state) return [];
    return APEX.Mythology.state.myths || [];
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

  function sampleHistoriography() {
    if (!APEX.Historiography || !APEX.Historiography.state) {
      return { globalChronicle: [], coalitions: [] };
    }
    const chron = APEX.Historiography.state.globalChronicle || [];
    const coalitions = sampleCoalitions();
    return { globalChronicle: chron, coalitions };
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

  function computeDoctrineConviction(coalitions) {
    if (!coalitions.length) return 0.5;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < coalitions.length; i++) {
      const d = coalitions[i].doctrine;
      if (!d) continue;
      sum += d.conviction || 0;
      count++;
    }
    if (!count) return 0.5;
    return clamp01(sum / count);
  }

  function computeHistoryCohesion(histState) {
    const chron = histState.globalChronicle || [];
    if (!chron.length) return 0.5;
    // crude cohesion: more entries with similar epoch => higher cohesion
    const epochCounts = {};
    for (let i = 0; i < chron.length; i++) {
      const e = chron[i];
      const ep = e.epoch || "ERA_DEFAULT";
      epochCounts[ep] = (epochCounts[ep] || 0) + 1;
    }
    let max = 0;
    let total = 0;
    for (const k in epochCounts) {
      const v = epochCounts[k];
      total += v;
      if (v > max) max = v;
    }
    if (!total) return 0.5;
    return clamp01(max / total);
  }

  function computeFusionStrength(mythVol, doctrineConv, histCoh, epochConf, conflict) {
    // Adaptive: some worlds become fusion-heavy, some not
    const base = Fusion.config.baseFusionRate;
    const tension = conflict.avgTension;
    const maxT = conflict.maxTension;

    let strength =
      base *
      (1.0 +
        mythVol * 0.7 +
        doctrineConv * 0.6 +
        (1.0 - histCoh) * 0.5 +
        (1.0 - epochConf) * 0.4 +
        tension * 0.5 +
        maxT * 0.4);

    return strength;
  }

  function pickMythRoots(myths) {
    if (!myths.length) return [];
    const roots = [];
    const count = Math.min(3, 1 + (Math.random() * 3) | 0);
    for (let i = 0; i < count; i++) {
      const m = myths[(Math.random() * myths.length) | 0];
      if (roots.indexOf(m) === -1) roots.push(m);
    }
    return roots;
  }

  function pickDoctrineRoots(coalitions) {
    const docs = [];
    for (let i = 0; i < coalitions.length; i++) {
      const d = coalitions[i].doctrine;
      if (!d) continue;
      if (Math.random() < 0.4) docs.push({ coalition: coalitions[i], doctrine: d });
    }
    return docs.slice(0, 4);
  }

  function pickHistoricalAnchors(chron) {
    if (!chron.length) return [];
    const anchors = [];
    const count = Math.min(4, 1 + (Math.random() * 4) | 0);
    for (let i = 0; i < count; i++) {
      const e = chron[(Math.random() * chron.length) | 0];
      if (anchors.indexOf(e) === -1) anchors.push(e);
    }
    return anchors;
  }

  function labelFusion(epoch, mythRoots, doctrineRoots, anchors) {
    const epochLabel = epoch.label || "ERA";
    const mythCount = mythRoots.length;
    const docCount = doctrineRoots.length;
    const histCount = anchors.length;

    let base = "Cycle";

    if (docCount > 2 && mythCount > 1) base = "Doctrine Cycle";
    else if (mythCount > 2) base = "Mythic Lineage";
    else if (histCount > 2) base = "Chronicle Arc";

    const suffixes = [
      "of Divergent Truths",
      "of the Quiet Epochs",
      "of the Shifting Hand",
      "of Rewritten Memory",
      "of the Doctrine Wars",
      "of Fractured Chronicles",
      "of Silent Influence",
      "of Contested Origins"
    ];

    const suffix = suffixes[(Math.random() * suffixes.length) | 0];

    return base + " " + suffix + " (" + epochLabel + ")";
  }

  function createFusion(epoch, myths, coalitions, histState, conflict) {
    const mythRoots = pickMythRoots(myths);
    const doctrineRoots = pickDoctrineRoots(coalitions);
    const anchors = pickHistoricalAnchors(histState.globalChronicle);

    if (!mythRoots.length && !doctrineRoots.length && !anchors.length) return null;

    const histCoh = computeHistoryCohesion(histState);
    const mythVol = computeMythVolatility(myths);
    const docConv = computeDoctrineConviction(coalitions);
    const epochConf = epoch.confidence || 0.0;

    const label = labelFusion(epoch, mythRoots, doctrineRoots, anchors);

    const cohesion = clamp01(
      0.4 +
        histCoh * 0.3 +
        docConv * 0.2 -
        mythVol * 0.2 -
        (1.0 - epochConf) * 0.2
    );

    const drift = clamp01(
      0.3 +
        mythVol * 0.4 +
        (1.0 - histCoh) * 0.3 +
        conflict.avgTension * 0.2
    );

    const influence = clamp01(
      0.35 +
        docConv * 0.3 +
        histCoh * 0.2 +
        conflict.maxTension * 0.2
    );

    const fusion = {
      timeCreated: now(),
      label,
      mythRoots: mythRoots.map(m => m.label || "Myth"),
      doctrineRoots: doctrineRoots.map(d => ({
        coalition: d.coalition.name || "Coalition",
        stance: d.doctrine.stance || "PRAGMATIC",
        philosophy: d.doctrine.philosophy || "ARBITER"
      })),
      historicalAnchors: anchors.map(a => ({
        label: a.label || "Event",
        epoch: a.epoch || epoch.label
      })),
      epochContext: epoch.label,
      cohesion,
      drift,
      influence
    };

    return fusion;
  }

  function addFusion(fusion) {
    const st = Fusion.state;
    const cfg = Fusion.config;
    st.fusions.push(fusion);
    if (st.fusions.length > cfg.maxFusions) {
      st.fusions.splice(0, st.fusions.length - cfg.maxFusions);
    }
  }

  function driftFusion(fusion, mythVol, histCoh, conflict) {
    const cfg = Fusion.config;

    const driftFactor =
      cfg.baseDriftRate *
      (1.0 +
        mythVol * 0.7 +
        (1.0 - histCoh) * 0.5 +
        conflict.avgTension * 0.4);

    if (Math.random() > driftFactor) return;

    const dir = Math.random() < 0.5 ? -1 : 1;

    fusion.drift = clamp01(fusion.drift + dir * randRange(0.05, 0.15));
    fusion.cohesion = clamp01(
      fusion.cohesion +
        (dir < 0 ? randRange(0.02, 0.08) : -randRange(0.02, 0.08))
    );

    if (fusion.cohesion < 0.25 && Math.random() < 0.3) {
      pushScenarioEvent(
        "Fusion Schism",
        "A myth-historical fusion fractures: " + fusion.label + "."
      );
    }
  }

  function applyFusionInfluenceToCoalitions(fusions, coalitions) {
    if (!coalitions.length || !fusions.length) return;

    for (let i = 0; i < fusions.length; i++) {
      const f = fusions[i];
      if (f.influence < Fusion.config.minInfluenceForImpact) continue;

      for (let j = 0; j < coalitions.length; j++) {
        const c = coalitions[j];
        if (!c.doctrine) continue;

        const stance = c.doctrine.stance || "PRAGMATIC";
        const phil = c.doctrine.philosophy || "ARBITER";

        let alignScore = 0.0;

        for (let k = 0; k < f.doctrineRoots.length; k++) {
          const root = f.doctrineRoots[k];
          if (root.stance === stance) alignScore += 0.2;
          if (root.philosophy === phil) alignScore += 0.2;
        }

        alignScore = clamp01(alignScore);

        if (!c.fusionState) {
          c.fusionState = {
            exposure: 0.0,
            alignment: 0.5
          };
        }

        c.fusionState.exposure = clamp01(
          c.fusionState.exposure + f.influence * 0.05
        );
        c.fusionState.alignment = clamp01(
          c.fusionState.alignment + (alignScore - 0.5) * 0.1
        );

        // Influence doctrine conviction and identity cohesion slightly
        if (c.doctrine.conviction != null) {
          c.doctrine.conviction = clamp01(
            c.doctrine.conviction +
              (c.fusionState.alignment - 0.5) * 0.05 * f.influence
          );
        }
        if (c.identity && c.identity.cohesion != null) {
          c.identity.cohesion = clamp01(
            c.identity.cohesion +
              (c.fusionState.exposure - 0.5) * 0.04 * f.influence
          );
        }
      }
    }
  }

  Fusion.updateGlobalFusion = (function () {
    let lastUpdate = 0;

    return function updateGlobalFusion(formations, dt) {
      const t = now();
      const st = Fusion.state;

      const myths = sampleMyths();
      const coalitions = sampleCoalitions();
      const histState = sampleHistoriography();
      const epoch = sampleEpoch();
      const conflict = sampleConflict();

      const mythVol = computeMythVolatility(myths);
      const docConv = computeDoctrineConviction(coalitions);
      const histCoh = computeHistoryCohesion(histState);
      const epochConf = epoch.confidence || 0.0;

      const fusionStrength = computeFusionStrength(
        mythVol,
        docConv,
        histCoh,
        epochConf,
        conflict
      );

      // Drift existing fusions
      for (let i = 0; i < st.fusions.length; i++) {
        driftFusion(st.fusions[i], mythVol, histCoh, conflict);
      }

      // Apply influence to coalitions
      applyFusionInfluenceToCoalitions(st.fusions, coalitions);

      if (t - lastUpdate < st.fusionInterval) return;
      lastUpdate = t;

      if (Math.random() > fusionStrength) return;

      const fusion = createFusion(epoch, myths, coalitions, histState, conflict);
      if (!fusion) return;

      addFusion(fusion);

      pushScenarioEvent(
        "Myth-Historical Fusion",
        "A new myth-historical cycle emerges: " + fusion.label + "."
      );
    };
  })();

  console.log("PHASE53_HISTFUSION — online (Historical Myth Fusion Layer, Adaptive).");
})(this);
