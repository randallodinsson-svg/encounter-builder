/*
    HALO Renderer v4.4 — Data-Aligned
*/

(function () {

    let canvas = null;
    let ctx = null;

    function start() {
        canvas = document.getElementById("haloCanvas");
        if (!canvas) {
            console.error("HALO Renderer v4.4 — canvas not found");
            return;
        }

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        console.log("HALO Renderer v4.4 initialized");
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx = canvas.getContext("2d");
    }

    function render() {
        if (!ctx) return;

        const entitiesModule   = APEX.get("entities");
        const formationsModule = APEX.get("formations");
        if (!entitiesModule || !formationsModule) return;

        const entities   = entitiesModule.getAll ? entitiesModule.getAll() : [];
        const formations = formationsModule.getAll ? formationsModule.getAll() : [];

        // HALO draws on top of APEXSIM; no clear here

        // Formations
        ctx.strokeStyle = "rgba(255,60,60,0.9)";
        ctx.lineWidth = 2;

        for (const f of formations) {
            if (!f.radius || !f.center) continue;

            ctx.beginPath();
            ctx.arc(f.center.x, f.center.y, f.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Entities
        for (const e of entities) {
            if (!e.position) continue;

            ctx.fillStyle = "rgba(255,80,80,1)";
            ctx.beginPath();
            ctx.arc(e.position.x, e.position.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    APEX.register("renderer", {
        type: "renderer",
        start,
        render
    });

})();
