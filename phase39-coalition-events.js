// phase39-coalition-events.js
// APEXCORE v4.4 — Phase 39: Coalition Event Engine (Cinematic Mode)

(function (global) {
  const APEX = global.APEX || (global.APEX = {});
  const CoalEvents = (APEX.CoalEvents = APEX.CoalEvents || {});

  CoalEvents.state = {
    lastEventTime: 0,
    cooldown: 1.8 // seconds between events
  };

  CoalEvents.config = {
    rivalryFlashpoint: 0.55,
    conflictFlashpoint: 0.45,
    dominanceShiftThreshold: 0.25,
    fractureThreshold: 0.65,
    mergeThreshold: 0.15
  };

  function now() {
    return performance.now() / 1000;
  }

  function pushEvent(label, text) {
    if (!APEX.ScenarioFeed) return;
    APEX.ScenarioFeed.pushEvent(label, text);
  }

  function cinematicLine(type, a, b) {
    switch (type) {
      case "rivalry-surge":
        return `Tension spikes as ${a} turns its focus toward ${b}.`;
      case "conflict-surge":
        return `${a} presses the advantage, forcing ${b} into a defensive posture.`;
      case "fracture":
        return `${a} fractures under rising internal pressure.`;
      case "merge":
        return `${a} and ${b} drift into alignment, forming a tentative union.`;
      case "power-shift":
        return `${a} seizes momentum, overshadowing ${b}.`;
      case "standoff":
        return `${a} and ${b} lock into a tense standoff.`;
      case "probe":
        return `${a} tests the resolve of ${b} with a calculated advance.`;
      case "retreat":
        return `${a} yields ground, momentum slipping away.`;
      default:
        return `${a} and ${b} shift in unexpected ways.`;
    }
  }

  function tryEvent(intel, dt) {
    const t = now();
    if (t - CoalEvents.state.lastEventTime < CoalEvents.state.cooldown) return;
    CoalEvents.state.lastEventTime = t;

    const cfg = CoalEvents.config;

    // Rivalry + Conflict data
    const rivals = APEX.CoalRivalry?.state?.rivalries || [];
    const conflicts = APEX.CoalConflict?.state?.conflicts || [];

    // 1. Rivalry flashpoints
    for (let r of rivals) {
      if (r.tension > cfg.rivalryFlashpoint) {
        const a = intel.find(c => c.id === r.aId);
        const b = intel.find(c => c.id === r.bId);
        if (!a || !b) continue;
        pushEvent("Rivalry Surge", cinematicLine("rivalry-surge", a.id, b.id));
        return;
      }
    }

