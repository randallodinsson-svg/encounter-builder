/*
    APEXCORE v4.4 — HALO Renderer
    Node/link visualizer for Entities registry.
*/

(function () {
  const Renderer = {
    canvas: null,
    ctx: null,

    start() {
      this.canvas = document.getElementById("halo-canvas");
      if (!this.canvas) {
        console.warn("HALO Renderer — canvas #halo-canvas not found.");
        return;
      }

      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());

      console.log("APEXCORE v4.4 — HALO Renderer online.");
      this.loop();
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    loop() {
      requestAnimationFrame(() => this.loop());
      this.render();
    },

    render() {
      const vis = window.APEX_VIS || {};
      if (vis.halo === false && vis.dual !== true) return;

      const Entities = APEX.get("entities");
      if (!Entities || !this.ctx) return;

      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      const list = Entities.getAll ? Entities.getAll() : Entities.list || [];
      if (!list.length) return;

      ctx.save();
      ctx.globalAlpha = 0.9;

      // Links
      ctx.strokeStyle = "rgba(255, 220, 120, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      for (let i = 0; i < list.length - 1; i++) {
        const a = list[i];
        const b = list[i + 1];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // Nodes
      ctx.fillStyle = "rgba(255, 240, 180, 0.95)";
      for (const e of list) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
  };

  APEX.register("renderer", Renderer);
})();
