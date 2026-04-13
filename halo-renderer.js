/*
    APEXCORE v4.2 — HALO Renderer
    Responsible for drawing entities, formations, and debug visuals.
*/

(function () {

    let canvas, ctx;

    function init() {
        canvas = document.getElementById("haloCanvas");
        if (!canvas) {
            console.warn("HALO Renderer: canvas not found");
            return;
        }

        ctx = canvas.getContext("2d");

        resize();
        window.addEventListener("resize", resize);

        console.log("HALO Renderer initialized");
    }

    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    function render() {
        if (!ctx) return;

        // Clear screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw entities
        const ents = APEX.get("entities");
        if (ents) {
            const all = ents.all();
            for (const e of all) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw formation outlines
        const forms = APEX.get("formations");
        if (forms) {
            const all = forms.all();
            ctx.strokeStyle = "rgba(0,255,0,0.4)";
            for (const f of all) {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    const RendererModule = {
        type: "renderer",
        start: init,
        render
    };

    // ⭐ THIS IS THE FIX ⭐
    APEX.register("renderer", RendererModule);

})();
