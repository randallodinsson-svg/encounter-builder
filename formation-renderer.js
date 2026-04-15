// formation-renderer.js — Phase 10 (Influence‑Aware Visualization)

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
        // Draw cohesion radius
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.cohesionRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,150,255,0.18)";
        ctx.stroke();

        // Draw separation radius
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

        // Center point
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();

        // Target / anchor
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

        // Mode label
        ctx.font = "11px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(f.mode, f.x + 10, f.y - 10);
      }
    },
  };

  APEX.register("formation-renderer", Renderer);
})();
