// formation-renderer.js — Phase 11 (Shape Visualization)

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      console.log("FORMATION_RENDERER — online.");
      this.canvas = document.createElement("canvas");
      this.canvas.id = "formationOverlay";
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

      const ai = APEX.getModule("formation-ai");
      if (!ai) return;

      for (const f of ai.formations) {
        // Shape outline
        this.drawShape(ctx, f);

        // Cohesion radius
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.cohesionRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,150,255,0.18)";
        ctx.stroke();

        // Separation radius
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.separationRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,80,80,0.25)";
        ctx.stroke();

        // Facing vector
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(f.facing) * 80, f.y + Math.sin(f.facing) * 80);
        ctx.strokeStyle = "rgba(255,255,0,0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();

        // Target
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.targetX, f.targetY);
        ctx.strokeStyle = "rgba(0,255,180,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(f.targetX, f.targetY, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,255,180,0.8)";
        ctx.stroke();

        // Labels
        ctx.font = "11px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(`${f.mode} / ${f.shape}`, f.x + 10, f.y - 10);
      }
    },

    drawShape(ctx, f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.facing);

      ctx.strokeStyle = "rgba(0,255,200,0.6)";
      ctx.lineWidth = 1.5;

      const r = 40;

      ctx.beginPath();
      switch (f.shape) {
        case "line":
          ctx.moveTo(-r, 0);
          ctx.lineTo(r, 0);
          break;
        case "arc":
          ctx.arc(0, 0, r, -Math.PI * 0.3, Math.PI * 0.3);
          break;
        case "wedge":
          ctx.moveTo(-r, -r * 0.4);
          ctx.lineTo(r, 0);
          ctx.lineTo(-r, r * 0.4);
          ctx.closePath();
          break;
        case "cluster":
          ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
          break;
        case "spread":
        default:
          ctx.moveTo(-r, -r);
          ctx.lineTo(r, -r);
          ctx.lineTo(r, r);
          ctx.lineTo(-r, r);
          ctx.closePath();
          break;
      }
      ctx.stroke();
      ctx.restore();
    },
  };

  APEX.register("formation-renderer", Renderer);
})();
