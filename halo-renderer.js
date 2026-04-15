// halo-renderer.js — visual halo overlay

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("HALO Renderer — online.");
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

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    update(dt) {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      const haloSystem = APEX.getModule("halo-system");
      const haloField = APEX.getModule("halo-field");

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      if (haloSystem && haloSystem.halos.length > 0) {
        for (const hObj of haloSystem.halos) {
          this.drawHalo(ctx, hObj.x, hObj.y, 220, hObj.strength);
        }
      } else if (haloField) {
        this.drawHalo(ctx, haloField.x, haloField.y, 260, haloField.strength);
      }

      ctx.restore();
    },

    drawHalo(ctx, x, y, radius, strength) {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0, `rgba(80,200,255,${0.35 * strength})`);
      grd.addColorStop(0.4, `rgba(40,120,255,${0.25 * strength})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  APEX.register("halo-renderer", Renderer);
})();
