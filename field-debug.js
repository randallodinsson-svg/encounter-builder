/*
    APEXCORE v4.4 — Visual Field Debug Layer
    - Samples ENV_FIELD and renders vector arrows
    - Overlays on #field-debug-canvas
*/

(function () {

  const FIELD_DEBUG = {
    _canvas: null,
    _ctx: null,
    _w: 0,
    _h: 0,
    _accum: 0,
    _interval: 80, // ms between redraws

    start() {
      this._canvas = document.getElementById("field-debug-canvas");
      if (!this._canvas) {
        console.warn("FIELD_DEBUG: canvas not found.");
        return;
      }

      this._ctx = this._canvas.getContext("2d");
      if (!this._ctx) {
        console.warn("FIELD_DEBUG: 2D context not available.");
        return;
      }

      this._resize();
      window.addEventListener("resize", () => this._resize());

      console.log("APEXCORE v4.4 — Visual Field Debug Layer online.");
    },

    _resize() {
      if (!this._canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      this._canvas.width = w * dpr;
      this._canvas.height = h * dpr;
      this._canvas.style.width = w + "px";
      this._canvas.style.height = h + "px";

      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this._w = w;
      this._h = h;
    },

    update(dt) {
      if (!this._ctx) return;
      this._accum += dt;
      if (this._accum < this._interval) return;
      this._accum = 0;

      this._draw();
    },

    _draw() {
      const ctx = this._ctx;
      const env = window.ENV_FIELD;
      if (!env || !env.sample) return;

      const w = this._w;
      const h = this._h;

      ctx.clearRect(0, 0, w, h);

      const cols = 28;
      const rows = 16;

      const dx = w / cols;
      const dy = h / rows;

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 255, 180, 0.7)";
      ctx.fillStyle = "rgba(0, 255, 180, 0.7)";

      for (let iy = 1; iy < rows; iy++) {
        for (let ix = 1; ix < cols; ix++) {
          const x = ix * dx;
          const y = iy * dy;

          const nx = (x / w) * 2 - 1;
          const ny = (y / h) * 2 - 1;

          const f = env.sample(nx * 1000, ny * 1000);
          const fx = f.fx || 0;
          const fy = f.fy || 0;

          const mag = Math.sqrt(fx * fx + fy * fy) + 1e-6;
          const maxLen = Math.min(dx, dy) * 0.45;
          const len = Math.min(maxLen, mag * 40);

          const dirX = fx / mag;
          const dirY = fy / mag;

          const x2 = x + dirX * len;
          const y2 = y + dirY * len;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const ah = 4;
          const angle = Math.atan2(dirY, dirX);
          const left = angle + Math.PI * 0.75;
          const right = angle - Math.PI * 0.75;

          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 + Math.cos(left) * ah, y2 + Math.sin(left) * ah);
          ctx.lineTo(x2 + Math.cos(right) * ah, y2 + Math.sin(right) * ah);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
  };

  window.FIELD_DEBUG = FIELD_DEBUG;
  APEX.register("field-debug", FIELD_DEBUG);

})();
