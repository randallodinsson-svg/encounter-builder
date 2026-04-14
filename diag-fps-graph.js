/*
    APEXCORE v4.4 — FPS Graph Module
    5-second rolling history (300 frames @ 60fps)
*/

(function () {
    const MAX_POINTS = 300; // 5 seconds of history
    const data = new Array(MAX_POINTS).fill(0);

    const FPSGraph = {
        canvas: null,
        ctx: null,

        start() {
            this.canvas = document.getElementById("diag-fps-graph");
            if (!this.canvas) {
                console.warn("FPSGraph v4.4 — canvas not found.");
                return;
            }

            this.ctx = this.canvas.getContext("2d");
            console.log("APEXCORE v4.4 — FPS Graph online.");
        },

        onTick(delta) {
            if (!this.ctx) return;

            // Convert delta → FPS
            const fps = 1000 / (delta || 1);

            // Shift left, append new FPS
            data.shift();
            data.push(fps);

            this.render();
        },

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Background
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(0, 0, w, h);

            // Graph line
            ctx.strokeStyle = "#ffcc66";
            ctx.lineWidth = 1.2;
            ctx.beginPath();

            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * w;
                const y = h - (Math.min(data[i], 120) / 120) * h; // clamp at 120 FPS

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.stroke();
        },
    };

    APEX.register("fps-graph", FPSGraph);
})();
