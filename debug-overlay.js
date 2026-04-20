// APEXSIM Debug Overlay v1 — always-on, engine-agnostic

(function () {
  // Avoid double-inject
  if (window.__APEX_DEBUG_OVERLAY__) return;
  window.__APEX_DEBUG_OVERLAY__ = true;

  const root = document.createElement('div');
  root.id = 'apex-debug-overlay';
  Object.assign(root.style, {
    position: 'fixed',
    left: '16px',
    bottom: '16px',
    padding: '8px 10px',
    background: 'rgba(5,10,20,0.92)',
    color: '#A5B4C8',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '11px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    zIndex: 99999,
    pointerEvents: 'auto'
  });

  root.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <span style="letter-spacing:0.08em; text-transform:uppercase; color:#64B5F6;">
        APEXSIM · DEBUG
      </span>
      <button id="apex-debug-toggle"
              style="background:none; border:none; color:#78909C; cursor:pointer; font-size:11px;">
        hide
      </button>
    </div>
    <div id="apex-debug-body" style="display:flex; flex-direction:column; gap:2px;">
      <div id="apex-debug-line-engine">engine: <span style="color:#ECEFF1;">waiting for engine…</span></div>
      <div id="apex-debug-line-fps">fps: <span style="color:#ECEFF1;">–</span></div>
      <div id="apex-debug-line-phase">phase: <span style="color:#ECEFF1;">–</span></div>
      <div id="apex-debug-line-tick">tick: <span style="color:#ECEFF1;">–</span></div>
    </div>
    <div style="margin-top:4px; opacity:0.6;">
      <span style="color:#546E7A;">tilde (~)</span> to toggle overlay
    </div>
  `;

  document.body.appendChild(root);

  const btnToggle = root.querySelector('#apex-debug-toggle');
  const body = root.querySelector('#apex-debug-body');
  const lineEngine = root.querySelector('#apex-debug-line-engine span');
  const lineFps = root.querySelector('#apex-debug-line-fps span');
  const linePhase = root.querySelector('#apex-debug-line-phase span');
  const lineTick = root.querySelector('#apex-debug-line-tick span');

  let visible = true;
  btnToggle.addEventListener('click', () => {
    visible = !visible;
    body.style.display = visible ? 'flex' : 'none';
    btnToggle.textContent = visible ? 'hide' : 'show';
  });

  // Keyboard toggle: tilde (~)
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      visible = !visible;
      body.style.display = visible ? 'flex' : 'none';
      btnToggle.textContent = visible ? 'hide' : 'show';
    }
  });

  // FPS sampler (independent of engine)
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  function loop(ts) {
    frameCount++;
    const dt = ts - lastTime;
    if (dt >= 500) {
      fps = Math.round((frameCount * 1000) / dt);
      frameCount = 0;
      lastTime = ts;
      lineFps.textContent = String(fps);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Optional: hook into a global debug object if your engine exposes one
  // e.g. window.apexDebug = { phaseName, tick, engineLabel }
  function pollEngineDebug() {
    const dbg = window.apexDebug || window.APEXSIM_DEBUG || null;
    if (dbg) {
      if (dbg.engineLabel) lineEngine.textContent = dbg.engineLabel;
      if (dbg.phaseName) linePhase.textContent = dbg.phaseName;
      if (typeof dbg.tick === 'number') lineTick.textContent = String(dbg.tick);
    }
  }

  setInterval(pollEngineDebug, 200);
})();
