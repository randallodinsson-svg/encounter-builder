// FILE: halo-renderer.js
// HALO Renderer v4.4 — NUKE Rebuild (Overlay Visual)

(function () {
  const HaloRenderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("HALO Renderer — online.");

      // Create overlay canvas dynamically so we don't touch index.html
      this.canvas = document.createElement("canvas");
      this.canvas.id = "haloOverlay";
      Object.assign(this.canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      });
      document.body.appendChild(this.canvas);

      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
    },

    update(dt) {
      if (!this.canvas || !this.ctx || !window.HALO_FIELD) return;
      this.render();
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const halo = window.HALO_FIELD;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;

      // Outer halo ring
      ctx.beginPath();
      ctx.arc(cx, cy, halo.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 200, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner core
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
      ctx.fill();

      // Subtle radial glow
      const grad = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, halo.radius * 1.4
      );
      grad.addColorStop(0, "rgba(0, 255, 255, 0.18)");
      grad.addColorStop(1, "rgba(0, 255, 255, 0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, halo.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  APEX.register("halo-renderer", HaloRenderer);
})();
