/*
    APEXCORE v4.2 — HALO Renderer (FULLNUKE Edition)
    Responsible for drawing entities, formations, and debug visuals.
*/

(function () {

    let canvas = null;
    let ctx = null;

    function init() {
        canvas = document.getElementById("haloCanvas");

        if (!canvas) {
            console.error("HALO Renderer — ERROR: <canvas id='haloCanvas'> not found.");
            return;
        }

        ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("HALO Renderer — ERROR: 2D context could not be created.");
            return;
        }

        resize();
        window.addEventListener("resize", resize);

        console.log("HALO Renderer initialized");
    }

    function resize() {
        if (!canvas) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    function render() {
        if (!ctx || !canvas) return;

        // Clear screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw entities
        const ents = APEX.get("entities");
        if (ents && typeof ents.all === "function") {
            const all = ents.all();
            for (const e of all) {
                if (!e) continue;
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(e.x || 0, e.y || 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw formation outlines
        const forms = APEX.get("formations");
        if (forms && typeof forms.all === "function") {
            const all = forms.all();
            ctx.strokeStyle = "rgba(0,255,0,0.4)";
            for (const f of all) {
                if (!f) continue;
                ctx.beginPath();
                ctx.arc(f.x || 0, f.y || 0, f.radius || 20, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    const RendererModule = {
        type: "renderer",
        start: init,
        render
    };

    APEX.register("renderer", RendererModule);

})();
