/*
    APEXCORE v4.4 — HALO Renderer (Network Field)
*/

(function () {
  const Entities = APEX.get("entities");

  const HaloRenderer = {
    canvas: null,
    ctx: null,
    maxLinks: 6,
    linkDistance: 160,

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
      requestAnimationFrame(this.loop.bind(this));
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    loop() {
      this.render();
      requestAnimationFrame(this.loop.bind(this));
    },

    render() {
      const ctx = this.ctx;
      if (!ctx) return;

      const ents = Entities.list;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background glow
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, w, h);

      // Draw links
      ctx.lineWidth = 0.5;
      for (let i = 0; i < ents.length; i++) {
        const a = ents[i];
        let links = 0;
        for (let j = i + 1; j < ents.length && links < this.maxLinks; j++) {
          const b = ents[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.linkDistance) {
            const alpha = 1 - dist / this.linkDistance;
            ctx.strokeStyle = `rgba(255, 200, 120, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            links++;
          }
        }
      }

      // Draw nodes
      ctx.fillStyle = "#ffcc66";
      for (const e of ents) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  APEX.register("renderer", HaloRenderer);
})();
