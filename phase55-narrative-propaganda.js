// phase55-narrative-propaganda.js
// APEXCORE v4.4 — Phase 55: Narrative Propaganda Engine (Adaptive)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Prop = (APEX.Propaganda = APEX.Propaganda || {});

  Prop.state = {
    lastUpdate: 0,
    lastBroadcast: 0,
    broadcastInterval: 14.0,
    driftInterval: 6.0
  };

  Prop.config = {
    baseIntensity: 0.25,
    baseSpread: 0.25,
    baseDistortion: 0.2,
    minAggressionForOffensive: 0.45,
    minCohesionForUnifiedMessage: 0.4,
    distortionRiskThreshold: 0.75,
    collapseThreshold: 0.2
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

  function sampleBlocs() {
    if (!APEX.NarrativeBlocs || !APEX.NarrativeBlocs.state) return [];
    return APEX.NarrativeBlocs.state.blocs || [];
  }

  function sampleFusions() {
    if (!APEX.HistFusion || !APEX.HistFusion.state) return [];
    return APEX.HistFusion.state.fusions || [];
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

  function computePropagandaIntensity(bloc, fusionField, conflict) {
    const cfg = Prop.config;

    let intensity =
      cfg.baseIntensity +
      (bloc.narrativeAggression || 0) * 0.4 +
      fusionField * 0.3 +
      conflict.avgTension * 0.3;

    return clamp01(intensity);
  }

  function computePropagandaSpread(bloc, fusionField) {
    const cfg = Prop.config;

    let spread =
      cfg.baseSpread +
      (bloc.cohesion || 0) * 0.3 +
      fusionField * 0.2;

    return clamp01(spread);
  }

  function computePropagandaDistortion(bloc, conflict) {
    const cfg = Prop.config;

    let distortion =
      cfg.baseDistortion +
      (1.0 - (bloc.cohesion || 0)) * 0.4 +
      conflict.maxTension * 0.3;

    return clamp01(distortion);
  }

  function driftBlocPropaganda(bloc, fusionField, conflict) {
    if (!bloc.propaganda) {
      bloc.propaganda = {
        intensity: 0.5,
        spread: 0.5,
        distortion: 0.3,
        targets: []
      };
    }

    const p = bloc.propaganda;

    p.intensity = clamp01(
      p.intensity +
        (computePropagandaIntensity(bloc, fusionField, conflict) - p.intensity) *
          randRange(0.05, 0.15)
    );

    p.spread = clamp01(
      p.spread +
        (computePropagandaSpread(bloc, fusionField) - p.spread) *
          randRange(0.05, 0.15)
    );

    p.distortion = clamp01(
      p.distortion +
        (computePropagandaDistortion(bloc, conflict) - p.distortion) *
          randRange(0.05, 0.15)
    );

    if (p.distortion > Prop.config.distortionRiskThreshold && Math.random() < 0.25) {
      pushScenarioEvent(
        "Propaganda Distortion Spike",
        bloc.label +
          " experiences a surge in narrative distortion, risking internal fractures."
      );
    }
  }

  function pickPropagandaTargets(bloc, blocs) {
    const targets = [];
    for (let i = 0; i < blocs.length; i++) {
      const b = blocs[i];
      if (b.id === bloc.id) continue;

      const hostility = (bloc.hostility && bloc.hostility[b.id]) || 0;
      const aggression = bloc.narrativeAggression || 0;

      const score =
        hostility * 0.6 +
        aggression * 0.4 +
        randRange(-0.1, 0.1);

      if (score > 0.45) targets.push(b);
    }
    return targets;
  }

  function broadcastPropaganda(bloc, targets, fusions) {
    if (!targets.length) return;

    const p = bloc.propaganda;
    const anchor = bloc.anchorFusionLabel || "its myth-history";

    const distortionTag =
      p.distortion > 0.65
        ? "distorted"
        : p.distortion > 0.45
        ? "embellished"
        : "assertive";

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];

      pushScenarioEvent(
        "Propaganda Offensive",
        bloc.label +
          " launches a " +
          distortionTag +
          " narrative broadcast targeting " +
          t.label +
          " over " +
          anchor +
          "."
      );
    }
  }

  function applyPropagandaEffects(bloc, targets) {
    const p = bloc.propaganda;
    if (!p) return;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];

      t.cohesion = clamp01(
        (t.cohesion || 0.5) -
          p.distortion * randRange(0.02, 0.08)
      );

      t.narrativeAggression = clamp01(
        (t.narrativeAggression || 0.5) +
          p.intensity * randRange(0.02, 0.06)
      );

      if (t.cohesion < Prop.config.collapseThreshold && Math.random() < 0.2) {
        pushScenarioEvent(
          "Narrative Collapse",
          t.label +
            " suffers a narrative collapse under propaganda pressure from " +
            bloc.label +
            "."
        );
      }
    }
  }

  Prop.updateGlobalPropaganda = (function () {
    let lastDrift = 0;

    return function updateGlobalPropaganda(formations, dt) {
      const t = now();
      const st = Prop.state;
      const cfg = Prop.config;

      const blocs = sampleBlocs();
      const fusions = sampleFusions();
      const conflict = sampleConflict();

      if (!blocs.length) return;

      const fusionField = computeFusionField(fusions);

      if (t - lastDrift > st.driftInterval) {
        lastDrift = t;
        for (let i = 0; i < blocs.length; i++) {
          driftBlocPropaganda(blocs[i], fusionField, conflict);
        }
      }

      if (t - st.lastBroadcast > st.broadcastInterval) {
        st.lastBroadcast = t;

        for (let i = 0; i < blocs.length; i++) {
          const bloc = blocs[i];
          const p = bloc.propaganda;

          if (!p) continue;

          if (p.intensity < cfg.minAggressionForOffensive) continue;

          const targets = pickPropagandaTargets(bloc, blocs);
          if (!targets.length) continue;

          broadcastPropaganda(bloc, targets, fusions);
          applyPropagandaEffects(bloc, targets);
        }
      }
    };
  })();

  console.log("PHASE55_PROPAGANDA — online (Narrative Propaganda Engine, Adaptive).");
})(this);
