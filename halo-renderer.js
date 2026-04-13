/*
    APEXCORE v4.2 — HALO Renderer (Phase 5)
    Now supports entity rendering.
*/

(function () {
    let canvas, ctx;
    let width = 0;
    let height = 0;

    function createCanvas(root) {
        const host = document.createElement("div");
        host.className = "apex-canvas-host";

        canvas = document.createElement("canvas");
        canvas.width = root.clientWidth;
        canvas.height = root.clientHeight;

        host.appendChild(canvas);

        const debugLabel = document.createElement("div");
        debugLabel.className = "apex-debug-label";
        debugLabel.textContent = "APEXCORE v4.2 — HALO Renderer";
        host.appendChild(debugLabel);

        root.appendChild(host);

        ctx = canvas.getContext("2d");
        resize(root.clientWidth, root.clientHeight);
    }

    function resize(w, h) {
        width = w;
        height = h;

        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;
    }

    function render(state) {
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // Pulsing halo
        const t = state.time * 0.002;
        const radius = 40 + Math.sin(t) * 10;

        const cx = width * 0.5;
        const cy = height * 0.5;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
        gradient.addColorStop(0, "rgba(0, 255, 180, 0.35)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core marker
        ctx.strokeStyle = "rgba(0, 255, 180, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // ENTITY RENDERING (Phase 5)
        const entityModule = APEX.get("entities");
        if (entityModule && typeof entityModule.render === "function") {
            entityModule.render(ctx, width, height);
        }
    }

    const HaloRenderer = {
        init(rootElement) {
            createCanvas(rootElement);
            console.log("HALO Renderer v4.2 — Initialized");
        },
        update(state) {
            render(state);
        },
        resize(width, height) {
            resize(width, height);
        }
    };

    APEX.register("renderer", HaloRenderer);
})();
