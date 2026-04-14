// ------------------------------------------------------------
// APEXCORE v4.4 — APEXSIM RENDERER
// ------------------------------------------------------------

(function () {
  const sim = window.APEXSIM;
  const canvas = document.getElementById("apexsim-canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  let lastTime = performance.now();

  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;

    sim._state.delta = delta;
    sim._state.fps = 1000 / delta;

    if (!sim._state.paused) updateParticles(delta);
    renderParticles();

    requestAnimationFrame(loop);
  }

  function updateParticles(delta) {
    const s = sim._state;

    for (let p of s.particles) {
      p.x += p.vx * s.particleSpeed;
      p.y += p.vy * s.particleSpeed;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }
  }

  function renderParticles() {
    const s = sim._state;

    if (!s.trailsEnabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "#ffb347";

    for (let p of s.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(loop);
})();
