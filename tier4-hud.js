// tier4-hud.js
// TIER-4 TACTICAL OVERLAY HUD — unified, drop-in module
// Assumes a browser environment and an existing engine/CAIK state feed.

(function (global) {
  'use strict';

  const DEFAULT_THRESHOLDS = {
    tickOkMs: 1.0,
    tickWarnMs: 2.0,
    riskHigh: 0.7,
    confidenceHigh: 0.8,
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function injectStyles() {
    if (document.getElementById('t4-hud-styles')) return;
    const style = document.createElement('style');
    style.id = 't4-hud-styles';
    style.textContent = `
      .t4-hud-root {
        position: absolute;
        right: 16px;
        top: 16px;
        width: 260px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 11px;
        color: #d8e9ff;
        pointer-events: none;
        z-index: 9999;
      }

      .t4-hud-panel {
        background: rgba(4, 12, 24, 0.92);
        border: 1px solid rgba(80, 140, 220, 0.7);
        box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
        padding: 8px 10px;
        margin-bottom: 8px;
        backdrop-filter: blur(4px);
      }

      .t4-hud-header {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #7fb4ff;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .t4-hud-header span.t4-hud-label {
        opacity: 0.9;
      }

      .t4-hud-header span.t4-hud-tag {
        font-size: 9px;
        color: #4fd1ff;
        opacity: 0.8;
      }

      .t4-hud-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 2px 0;
      }

      .t4-hud-row-label {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 9px;
        color: #7f9bbf;
      }

      .t4-hud-row-value {
        font-size: 11px;
        color: #e6f1ff;
      }

      .t4-hud-bar {
        position: relative;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(10, 24, 40, 0.9);
        overflow: hidden;
        margin-top: 2px;
      }

      .t4-hud-bar-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        background: linear-gradient(90deg, #3bff9c, #4fd1ff);
        transition: width 0.18s linear, background-color 0.18s linear;
      }

      .t4-hud-bar-fill.warn {
        background: linear-gradient(90deg, #ffd54f, #ffb74d);
      }

      .t4-hud-bar-fill.crit {
        background: linear-gradient(90deg, #ff5252, #ff1744);
      }

      .t4-hud-mini {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
      }

      .t4-hud-mini-block {
        flex: 1;
        margin-right: 4px;
      }

      .t4-hud-mini-block:last-child {
        margin-right: 0;
      }

      .t4-hud-mini-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7f9bbf;
        margin-bottom: 1px;
      }

      .t4-hud-mini-value {
        font-size: 11px;
        color: #e6f1ff;
      }

      .t4-hud-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border: 1px solid rgba(79, 209, 255, 0.6);
        color: #4fd1ff;
      }

      .t4-hud-status-pill.ok {
        border-color: rgba(59, 255, 156, 0.7);
        color: #3bff9c;
      }

      .t4-hud-status-pill.warn {
        border-color: rgba(255, 213, 79, 0.8);
        color: #ffd54f;
      }

      .t4-hud-status-pill.crit {
        border-color: rgba(255, 82, 82, 0.9);
        color: #ff5252;
      }

      .t4-hud-arc-container {
        position: relative;
        width: 52px;
        height: 52px;
      }

      .t4-hud-arc-svg {
        width: 52px;
        height: 52px;
        transform: rotate(-90deg);
      }

      .t4-hud-arc-bg {
        stroke: rgba(40, 70, 110, 0.9);
        stroke-width: 3;
        fill: none;
      }

      .t4-hud-arc-fg {
        stroke: #4fd1ff;
        stroke-width: 3;
        fill: none;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.2s ease-out, stroke 0.2s ease-out;
      }

      .t4-hud-arc-node {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 10px;
        height: 10px;
        margin-left: -5px;
        margin-top: -5px;
        border-radius: 50%;
        background: radial-gradient(circle, #4fd1ff 0%, #0b1a2a 70%);
        box-shadow: 0 0 8px rgba(79, 209, 255, 0.8);
      }

      .t4-hud-arc-label {
        position: absolute;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7f9bbf;
      }

      .t4-hud-arc-value {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 11px;
        color: #e6f1ff;
      }

      .t4-hud-cmd-body {
        margin-top: 4px;
      }

      .t4-hud-cmd-line {
        font-size: 10px;
        color: #e6f1ff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .t4-hud-cmd-status {
        font-size: 9px;
        margin-top: 2px;
        color: #7f9bbf;
      }

      .t4-hud-cmd-status span {
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .t4-hud-cmd-progress {
        margin-top: 4px;
      }

      .t4-hud-cmd-bar {
        position: relative;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: rgba(10, 24, 40, 0.9);
        overflow: hidden;
      }

      .t4-hud-cmd-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        background: linear-gradient(90deg, #4fd1ff, #3bff9c);
        transition: width 0.15s linear, background-color 0.15s linear;
      }

      .t4-hud-cmd-fill.failed {
        background: linear-gradient(90deg, #ff5252, #ff1744);
      }

      .t4-hud-cmd-fill.pending {
        background: linear-gradient(90deg, #4fd1ff, #3bff9c);
      }

      .t4-hud-cmd-fill.confirmed {
        background: linear-gradient(90deg, #3bff9c, #4fd1ff);
      }

      .t4-hud-tick-pulse {
        position: absolute;
        right: 8px;
        top: 8px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(79, 209, 255, 0.0);
        background: radial-gradient(circle, #4fd1ff 0%, #0b1a2a 70%);
        opacity: 0.7;
        transition: box-shadow 0.18s ease-out, opacity 0.18s ease-out;
      }

      .t4-hud-tick-pulse.active {
        box-shadow: 0 0 12px 2px rgba(79, 209, 255, 0.9);
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function createArc(radius, strokeWidth) {
    const size = radius * 2 + strokeWidth;
    const center = size / 2;
    const r = radius;
    const circumference = 2 * Math.PI * r;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 't4-hud-arc-svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('class', 't4-hud-arc-bg');
    bg.setAttribute('cx', center);
    bg.setAttribute('cy', center);
    bg.setAttribute('r', r);

    const fg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fg.setAttribute('class', 't4-hud-arc-fg');
    fg.setAttribute('cx', center);
    fg.setAttribute('cy', center);
    fg.setAttribute('r', r);
    fg.setAttribute('stroke-dasharray', circumference.toString());
    fg.setAttribute('stroke-dashoffset', circumference.toString());

    svg.appendChild(bg);
    svg.appendChild(fg);

    return { svg, fg, circumference };
  }

  function createHUDRoot() {
    const root = createEl('div', 't4-hud-root');

    // System Band
    const systemPanel = createEl('div', 't4-hud-panel');
    const systemHeader = createEl('div', 't4-hud-header');
    systemHeader.appendChild(createEl('span', 't4-hud-label', 'TACTICAL OVERLAY — TIER 4'));
    const systemTag = createEl('span', 't4-hud-tag', 'SYSTEM');
    systemHeader.appendChild(systemTag);
    const tickPulse = createEl('div', 't4-hud-tick-pulse');
    systemPanel.appendChild(systemHeader);
    systemPanel.appendChild(tickPulse);

    const loadRow = createEl('div', 't4-hud-row');
    const loadLabel = createEl('div', 't4-hud-row-label', 'LOAD');
    const loadValue = createEl('div', 't4-hud-row-value', '0%');
    loadRow.appendChild(loadLabel);
    loadRow.appendChild(loadValue);
    const loadBar = createEl('div', 't4-hud-bar');
    const loadFill = createEl('div', 't4-hud-bar-fill');
    loadBar.appendChild(loadFill);

    const tickRow = createEl('div', 't4-hud-row');
    const tickLabel = createEl('div', 't4-hud-row-label', 'TICK');
    const tickValue = createEl('div', 't4-hud-row-value', '0.0ms');
    const tickStatus = createEl('span', 't4-hud-status-pill ok', 'OK');
    tickRow.appendChild(tickLabel);
    const tickRight = createEl('div');
    tickRight.appendChild(tickValue);
    tickRight.appendChild(document.createTextNode(' '));
    tickRight.appendChild(tickStatus);
    tickRow.appendChild(tickRight);

    const churnRow = createEl('div', 't4-hud-row');
    const churnLabel = createEl('div', 't4-hud-row-label', 'CHURN');
    const churnValue = createEl('div', 't4-hud-row-value', '0 changed');
    churnRow.appendChild(churnLabel);
    churnRow.appendChild(churnValue);

    systemPanel.appendChild(loadRow);
    systemPanel.appendChild(loadBar);
    systemPanel.appendChild(tickRow);
    systemPanel.appendChild(churnRow);

    // Tactical State
    const tacticalPanel = createEl('div', 't4-hud-panel');
    const tacticalHeader = createEl('div', 't4-hud-header');
    tacticalHeader.appendChild(createEl('span', 't4-hud-label', 'TACTICAL OVERLAY — TIER 4'));
    tacticalHeader.appendChild(createEl('span', 't4-hud-tag', 'STATE'));
    tacticalPanel.appendChild(tacticalHeader);

    const formationRow = createEl('div', 't4-hud-row');
    const formationLabel = createEl('div', 't4-hud-row-label', 'FORMATION');
    const formationValue = createEl('div', 't4-hud-row-value', '—');
    formationRow.appendChild(formationLabel);
    formationRow.appendChild(formationValue);

    const agentsRow = createEl('div', 't4-hud-row');
    const agentsLabel = createEl('div', 't4-hud-row-label', 'AGENTS');
    const agentsValue = createEl('div', 't4-hud-row-value', '0');
    agentsRow.appendChild(agentsLabel);
    agentsRow.appendChild(agentsValue);

    const miniRow = createEl('div', 't4-hud-mini');

    const stabilityBlock = createEl('div', 't4-hud-mini-block');
    const stabilityLabel = createEl('div', 't4-hud-mini-label', 'STABILITY');
    const stabilityValue = createEl('div', 't4-hud-mini-value', '—');
    stabilityBlock.appendChild(stabilityLabel);
    stabilityBlock.appendChild(stabilityValue);

    const riskBlock = createEl('div', 't4-hud-mini-block');
    const riskLabel = createEl('div', 't4-hud-mini-label', 'RISK');
    const riskValue = createEl('div', 't4-hud-mini-value', '0%');
    riskBlock.appendChild(riskLabel);
    riskBlock.appendChild(riskValue);

    miniRow.appendChild(stabilityBlock);
    miniRow.appendChild(riskBlock);

    const arcContainer = createEl('div', 't4-hud-arc-container');
    const arc = createArc(18, 3);
    arcContainer.appendChild(arc.svg);
    const arcNode = createEl('div', 't4-hud-arc-node');
    const arcLabel = createEl('div', 't4-hud-arc-label', 'CONFIDENCE');
    const arcValue = createEl('div', 't4-hud-arc-value', '0%');
    arcContainer.appendChild(arcNode);
    arcContainer.appendChild(arcLabel);
    arcContainer.appendChild(arcValue);

    const tacticalBottom = createEl('div', 't4-hud-row');
    tacticalBottom.style.marginTop = '6px';
    tacticalBottom.appendChild(miniRow);
    tacticalBottom.appendChild(arcContainer);

    tacticalPanel.appendChild(formationRow);
    tacticalPanel.appendChild(agentsRow);
    tacticalPanel.appendChild(tacticalBottom);

    // Command Feedback Loop
    const cmdPanel = createEl('div', 't4-hud-panel');
    const cmdHeader = createEl('div', 't4-hud-header');
    cmdHeader.appendChild(createEl('span', 't4-hud-label', 'TACTICAL OVERLAY — TIER 4'));
    cmdHeader.appendChild(createEl('span', 't4-hud-tag', 'COMMAND'));
    cmdPanel.appendChild(cmdHeader);

    const cmdBody = createEl('div', 't4-hud-cmd-body');
    const cmdLine = createEl('div', 't4-hud-cmd-line', 'CMD: —');
    const cmdStatus = createEl('div', 't4-hud-cmd-status');
    const cmdStatusSpan = createEl('span', null, 'STATUS: —');
    cmdStatus.appendChild(cmdStatusSpan);

    const cmdProgress = createEl('div', 't4-hud-cmd-progress');
    const cmdBar = createEl('div', 't4-hud-cmd-bar');
    const cmdFill = createEl('div', 't4-hud-cmd-fill');
    cmdBar.appendChild(cmdFill);
    cmdProgress.appendChild(cmdBar);

    cmdBody.appendChild(cmdLine);
    cmdBody.appendChild(cmdStatus);
    cmdBody.appendChild(cmdProgress);
    cmdPanel.appendChild(cmdBody);

    root.appendChild(systemPanel);
    root.appendChild(tacticalPanel);
    root.appendChild(cmdPanel);

    return {
      root,
      tickPulse,
      loadValue,
      loadFill,
      tickValue,
      tickStatus,
      churnValue,
      formationValue,
      agentsValue,
      stabilityValue,
      riskValue,
      arc,
      arcValue,
      cmdLine,
      cmdStatusSpan,
      cmdFill,
    };
  }

  function computeLoadPercent(lastTickDurationMs, thresholds) {
    if (lastTickDurationMs <= 0) return 0;
    const { tickOkMs, tickWarnMs } = thresholds;
    const maxRef = tickWarnMs * 1.5;
    const pct = clamp((lastTickDurationMs / maxRef) * 100, 0, 100);
    return pct;
  }

  function classifyTick(lastTickDurationMs, thresholds) {
    const { tickOkMs, tickWarnMs } = thresholds;
    if (lastTickDurationMs <= tickOkMs) return 'OK';
    if (lastTickDurationMs <= tickWarnMs) return 'WARN';
    return 'CRIT';
  }

  function classifyStability(lastTickDurationMs, churnChanged, thresholds) {
    const tickClass = classifyTick(lastTickDurationMs, thresholds);
    if (tickClass === 'CRIT') return 'DEGRADED';
    if (tickClass === 'WARN' || churnChanged > 40) return 'STRESSED';
    return 'STABLE';
  }

  function colorForConfidence(conf) {
    if (conf >= 0.8) return '#4fd1ff';
    if (conf >= 0.4) return '#ffd54f';
    return '#ff5252';
  }

  function formatMs(ms) {
    if (!ms || ms <= 0) return '0.0ms';
    return ms.toFixed(1) + 'ms';
  }

  function formatPercent01(v) {
    const pct = clamp(v * 100, 0, 100);
    return pct.toFixed(0) + '%';
  }

  function formatCommandLine(cmd) {
    if (!cmd || !cmd.type) return 'CMD: —';
    const target = cmd.target != null ? ` → ${String(cmd.target)}` : '';
    return `CMD: ${cmd.type}${target}`;
  }

  function formatCommandStatus(cmd, nowTick) {
    if (!cmd || !cmd.status) return 'STATUS: —';
    const status = cmd.status.toUpperCase();
    let suffix = '';
    if (cmd.issuedAtTick != null && nowTick != null) {
      const dt = nowTick - cmd.issuedAtTick;
      if (dt >= 0) suffix = ` (${dt.toFixed(2)}t)`;
    }
    if (cmd.reason && status === 'FAILED') {
      return `STATUS: ${status}${suffix} — ${cmd.reason}`;
    }
    return `STATUS: ${status}${suffix}`;
  }

  function classifyCommandStatus(status) {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s === 'CONFIRMED') return 'confirmed';
    if (s === 'FAILED') return 'failed';
    return 'pending';
  }

  function Tier4HUD(options) {
    this.thresholds = Object.assign({}, DEFAULT_THRESHOLDS, options && options.thresholds);
    this.state = {
      lastTickDuration: 0,
      lastChurnChanged: 0,
      lastRisk: 0,
      lastConfidence: 0,
      lastCmdStatusClass: 'pending',
      lastTickPulseTime: 0,
    };
    injectStyles();
    const ui = createHUDRoot();
    this.ui = ui;
    this.root = ui.root;
    this._lastTickPulseTimeout = null;
  }

  Tier4HUD.prototype.attachTo = function (container) {
    if (!container) container = document.body;
    container.appendChild(this.root);
  };

  Tier4HUD.prototype._pulseTick = function (intensity) {
    const pulse = this.ui.tickPulse;
    pulse.classList.add('active');
    pulse.style.boxShadow = `0 0 12px 2px rgba(79, 209, 255, ${clamp(intensity, 0.2, 1.0)})`;
    pulse.style.opacity = '1';
    if (this._lastTickPulseTimeout) {
      clearTimeout(this._lastTickPulseTimeout);
    }
    this._lastTickPulseTimeout = setTimeout(() => {
      pulse.classList.remove('active');
      pulse.style.boxShadow = '0 0 0 0 rgba(79, 209, 255, 0.0)';
      pulse.style.opacity = '0.7';
    }, 180);
  };

  Tier4HUD.prototype.update = function (registrySnapshot, caikState) {
    const ui = this.ui;
    const thresholds = this.thresholds;

    const profilerLastTickDuration =
      registrySnapshot && typeof registrySnapshot['profiler.lastTickDuration'] === 'number'
        ? registrySnapshot['profiler.lastTickDuration']
        : 0;

    const timelineEvents = registrySnapshot && registrySnapshot['timeline.events'];
    const lastEvent =
      Array.isArray(timelineEvents) && timelineEvents.length > 0
        ? timelineEvents[timelineEvents.length - 1]
        : null;
    const churnChanged =
      lastEvent && lastEvent.registry && typeof lastEvent.registry.changed === 'number'
        ? lastEvent.registry.changed
        : 0;

    const haloAgentCount =
      registrySnapshot && typeof registrySnapshot['halo.agentCount'] === 'number'
        ? registrySnapshot['halo.agentCount']
        : 0;

    const formation =
      (caikState && caikState.state && caikState.state.formation) ||
      (registrySnapshot && registrySnapshot['halo.formation']) ||
      'SWARM';

    const risk =
      caikState && caikState.state && typeof caikState.state.risk === 'number'
        ? clamp(caikState.state.risk, 0, 1)
        : 0;

    const confidence =
      caikState && caikState.state && typeof caikState.state.confidence === 'number'
        ? clamp(caikState.state.confidence, 0, 1)
        : 0;

    const lastCommand = caikState && caikState.cfl && caikState.cfl.lastCommand;
    const nowTick =
      registrySnapshot && typeof registrySnapshot['example.ticks'] === 'number'
        ? registrySnapshot['example.ticks']
        : null;

    // System band
    const loadPct = computeLoadPercent(profilerLastTickDuration, thresholds);
    ui.loadValue.textContent = `${loadPct.toFixed(0)}%`;
    ui.loadFill.style.width = `${loadPct.toFixed(0)}%`;
    ui.loadFill.classList.remove('warn', 'crit');

    const tickClass = classifyTick(profilerLastTickDuration, thresholds);
    ui.tickValue.textContent = formatMs(profilerLastTickDuration);
    ui.tickStatus.textContent = tickClass;
    ui.tickStatus.classList.remove('ok', 'warn', 'crit');
    if (tickClass === 'OK') {
      ui.tickStatus.classList.add('ok');
    } else if (tickClass === 'WARN') {
      ui.tickStatus.classList.add('warn');
      ui.loadFill.classList.add('warn');
    } else {
      ui.tickStatus.classList.add('crit');
      ui.loadFill.classList.add('crit');
    }

    ui.churnValue.textContent = `${churnChanged} changed`;

    // Tick pulse intensity based on duration
    const pulseIntensity = clamp(profilerLastTickDuration / thresholds.tickWarnMs, 0.2, 1.0);
    this._pulseTick(pulseIntensity);

    // Tactical state
    ui.formationValue.textContent = formation;
    ui.agentsValue.textContent = String(haloAgentCount);

    const stability = classifyStability(profilerLastTickDuration, churnChanged, thresholds);
    ui.stabilityValue.textContent = stability;

    ui.riskValue.textContent = formatPercent01(risk);

    const arc = ui.arc;
    const circumference = arc.circumference;
    const targetOffset = circumference * (1 - confidence);
    arc.fg.style.strokeDashoffset = targetOffset.toString();
    const confColor = colorForConfidence(confidence);
    arc.fg.style.stroke = confColor;
    ui.arcValue.textContent = formatPercent01(confidence);

    // Command feedback loop
    ui.cmdLine.textContent = formatCommandLine(lastCommand);
    ui.cmdStatusSpan.textContent = formatCommandStatus(lastCommand, nowTick);

    const statusClass = classifyCommandStatus(lastCommand && lastCommand.status);
    ui.cmdFill.classList.remove('pending', 'confirmed', 'failed');
    ui.cmdFill.classList.add(statusClass);

    let progressPct = 0;
    if (lastCommand && lastCommand.issuedAtTick != null && nowTick != null) {
      const dt = nowTick - lastCommand.issuedAtTick;
      const timeoutTicks = lastCommand.timeoutTicks || 2.0;
      progressPct = clamp((dt / timeoutTicks) * 100, 0, 100);
    }
    if (statusClass === 'confirmed') {
      progressPct = 100;
    }
    ui.cmdFill.style.width = `${progressPct.toFixed(0)}%`;
  };

  Tier4HUD.create = function (container, options) {
    const hud = new Tier4HUD(options || {});
    hud.attachTo(container || document.body);
    return hud;
  };

  global.Tier4HUD = Tier4HUD;
})(window);

/*
USAGE EXAMPLE (pseudo-code):

// 1. Create HUD once, after DOM and engine are ready:
const hud = Tier4HUD.create(document.body, {
  thresholds: {
    tickOkMs: 1.0,
    tickWarnMs: 2.0,
    riskHigh: 0.7,
    confidenceHigh: 0.8,
  },
});

// 2. On each engine tick, feed latest registry snapshot + CAIK state:
function onTick(registrySnapshot, caikState) {
  hud.update(registrySnapshot, caikState);
}
*/
