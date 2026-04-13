/*
    APEXCORE v4.4 — HALO Renderer (Stable HALO Crew)
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

        console.log("HALO Renderer v4.4 initialized");
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

        const formations = APEX.get("formations");
        const entities = APEX.get("entities");

        // Formation ring
        if (formations && typeof formations.all === "function") {
            const forms = formations.all();
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 1.5;

            for (const f of forms) {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Entities — red HALO crew
        if (entities && typeof entities.all === "function") {
            const ents = entities.all();
            ctx.fillStyle = "#ff3333";

            for (const e of ents) {
                ctx.beginPath();
                ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    APEX.register("renderer", { type: "renderer", start: init, render });

})();
