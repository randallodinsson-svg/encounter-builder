// phase34-emergent-coalitions.js
// APEXCORE v4.4 — Phase 34: Emergent Coalition Layer

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const Coalitions = (APEX.Coalitions = APEX.Coalitions || {});

  Coalitions.state = {
    coalitions: []  // each coalition: { id, members: [formationIds], strength }
  };

  Coalitions.config = {
    motiveThreshold: 0.55,
    trustThreshold: 0.35,
    threatThreshold: 0.45,
    dissolveThreshold: 0.25,
    maxCoalitionSize: 6
  };

  function ensureCoalitionData(f) {
    if (!f.coalition) {
      f.coalition = {
        id: null,
        affinity: 0
      };
    }
  }

  function computeAffinity(a, b) {
    let score = 0;

    if (a.motives && b.motives) {
      score += Math.min(a.motives.alliance, b.motives.alliance) * 0.6;
      score += Math.min(a.motives.stability, b.motives.stability) * 0.4;
    }

    if (a.relationships && b.id in a.relationships) {
      const rel = a.relationships[b.id];
      if (rel > 0) score += rel * 0.5;
      else score -= Math.abs(rel) * 0.6;
    }

    return score;
  }

  function findCoalitionFor(f, formations, cfg) {
    let best = null;
    let bestScore = cfg.motiveThreshold;

    for (let i = 0; i < formations.length; i++) {
      const other = formations[i];
      if (other === f) continue;

      const score = computeAffinity(f, other);
      if (score > bestScore) {
        best = other;
        bestScore = score;
      }
    }

    return best;
  }

  function createCoalition(a, b) {
    const id = "coal_" + Math.random().toString(36).slice(2);
    const c = { id, members: [a.id, b.id], strength: 0.5 };
    Coalitions.state.coalitions.push(c);
    a.coalition.id = id;
    b.coalition.id = id;
  }

  function addToCoalition(f, coalition) {
    if (!coalition.members.includes(f.id)) {
      coalition.members.push(f.id);
      f.coalition.id = coalition.id;
    }
  }

  function updateCoalitionStrength(coalition, formations) {
    let total = 0;
    let count = 0;

    for (let i = 0; i < coalition.members.length; i++) {
      const id = coalition.members[i];
      const f = formations.find(x => x.id === id);
      if (!f || !f.motives) continue;
      total += f.motives.alliance + f.motives.stability;
      count++;
    }

    coalition.strength = count > 0 ? total / (count * 2) : 0;
  }

  function dissolveWeakCoalitions(formations, cfg) {
    Coalitions.state.coalitions = Coalitions.state.coalitions.filter(c => {
      if (c.strength < cfg.dissolveThreshold) {
        for (let i = 0; i < c.members.length; i++) {
          const f = formations.find(x => x.id === c.members[i]);
          if (f) f.coalition.id = null;
        }
        return false;
      }
      return true;
    });
  }

  Coalitions.updateFormationCoalitionState = function (formation, formations, dt) {
    const cfg = Coalitions.config;
    ensureCoalitionData(formation);

    if (formation.coalition.id) return;

    const partner = findCoalitionFor(formation, formations, cfg);
    if (!partner) return;

    ensureCoalitionData(partner);

    if (partner.coalition.id) {
      const coalition = Coalitions.state.coalitions.find(c => c.id === partner.coalition.id);
      if (coalition && coalition.members.length < cfg.maxCoalitionSize) {
        addToCoalition(formation, coalition);
      }
    } else {
      createCoalition(formation, partner);
    }
  };

  Coalitions.updateGlobalCoalitions = function (formations, dt) {
    const cfg = Coalitions.config;

    for (let i = 0; i < Coalitions.state.coalitions.length; i++) {
      updateCoalitionStrength(Coalitions.state.coalitions[i], formations);
    }

    dissolveWeakCoalitions(formations, cfg);
  };

  console.log("PHASE34_COALITIONS — online (Emergent Coalition Layer).");
})(this);
