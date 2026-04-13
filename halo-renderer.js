/*
    APEXCORE v4.2 — HALO Renderer (B1-A Clean Tactical Sim)
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

    function render(state) {
        if (!ctx || !canvas) return;

        const w = canvas.width;
        const h = canvas.height;

        // Background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);

        // Slight vignette
        const grad = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.1,
            w / 2, h / 2, Math.max(w, h) * 0.7
        );
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.6)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const formations = APEX.get("formations");
        const entities = APEX.get("entities");

        // Formation ring
        if (formations && typeof formations.all === "function") {
            const forms = formations.all();
            ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
            ctx.lineWidth = 1.5;

            for (const f of forms) {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Entities
        if (entities && typeof entities.all === "function") {
            const ents = entities.all();
            ctx.fillStyle = "#ffffff";

            for (const e of ents) {
                ctx.beginPath();
                ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    APEX.register("renderer", { type: "renderer", start: init, render });

})();
