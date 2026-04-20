// APEXSIM Debug Overlay (Module Safe)

if (!window.__APEX_DEBUG_OVERLAY__) {
  window.__APEX_DEBUG_OVERLAY__ = true;

  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed',
    left: '16px',
    bottom: '16px',
    padding: '8px 10px',
    background: 'rgba(5,10,20,0.92)',
    color: '#A5B4C8',
    fontFamily: 'system-ui',
    fontSize: '11px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '4px',
    zIndex: 99999
  });

  root.innerHTML = `
    <div style="color:#64B5F6; margin-bottom:4px;">APEXSIM · DEBUG</div>
    <div id="dbg-fps">fps: –</div>
    <div id="dbg-phase">phase: –</div>
    <div id="dbg-tick">tick: –</div>
  `;

  document.body.appendChild(root);

  const fpsEl = root.querySelector('#dbg-fps');
  const phaseEl = root.querySelector('#dbg-phase');
  const tickEl = root.querySelector('#dbg-tick');

  let last = performance.now();
  let frames = 0;

  function fpsLoop(ts) {
    frames++;
    if (ts - last >= 500) {
      const fps = Math.round((frames * 1000) / (ts - last));
      fpsEl.textContent = `fps: ${fps}`;
      frames = 0;
      last = ts;
    }
    requestAnimationFrame(fpsLoop);
  }
  requestAnimationFrame(fpsLoop);

  setInterval(() => {
    const dbg = window.apexDebug || window.APEXSIM_DEBUG;
    if (!dbg) return;

    if (dbg.phaseName) phaseEl.textContent = `phase: ${dbg.phaseName}`;
    if (typeof dbg.tick === 'number') tickEl.textContent = `tick: ${dbg.tick}`;
  }, 200);
}
