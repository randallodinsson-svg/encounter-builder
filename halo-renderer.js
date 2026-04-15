// halo-renderer.js — Phase 12 (Safe Gradient + NaN Protection)

(function () {
  const HaloRenderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("HALO Renderer — online.");

      this.canvas = document.createElement("canvas");
      this.canvas.id = "haloCanvas";
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
      if (!haloSystem || !haloSystem.halos) return;

      for (const hObj of haloSystem.halos) {
        this.drawHalo(hObj);
      }
    },

    // ---------------------------------------------------------
    // SAFE HALO DRAWING — prevents NaN crashes
    // ---------------------------------------------------------
    drawHalo(hObj) {
      const ctx = this.ctx;

      // Validate halo data
      if (
        !hObj ||
        !isFinite(hObj.x) ||
        !isFinite(hObj.y) ||
        !isFinite(hObj.strength)
      ) {
        return; // skip invalid halo
      }

      // Compute radius from strength
      const radius = Math.max(40, Math.abs(hObj.strength) * 120);

      if (!isFinite(radius)) return;

      // Create gradient safely
      const grad = ctx.createRadialGradient(
        hObj.x, hObj.y, 0,
        hObj.x, hObj.y, radius
      );

      grad.addColorStop(0, "rgba(0, 200, 255, 0.35)");
      grad.addColorStop(0.4, "rgba(0, 150, 255, 0.22)");
      grad.addColorStop(1, "rgba(0, 80, 200, 0)");

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(hObj.x, hObj.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Halo core
      ctx.beginPath();
      ctx.arc(hObj.x, hObj.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,255,0.9)";
      ctx.fill();
    },
  };

  APEX.register("halo-renderer", HaloRenderer);
})();
