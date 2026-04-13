/*
    HALO Renderer v4.4
    - Renders HALO formation and crew
    - Uses transparent fade instead of hard clear
    - Allows APEXSIM trails and overlays to remain visible
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

        // Match canvas to display size
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        console.log("HALO Renderer v4.4 initialized");
    }

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx = canvas.getContext("2d");
    }

    function render() {
        if (!ctx || !canvas) return;

        const entitiesModule = APEX.get("entities");
        const formationsModule = APEX.get("formations");
        if (!entitiesModule || !formationsModule) return;

        const entities = entitiesModule.getAll
            ? entitiesModule.getAll()
            : [];
        const formations = formationsModule.getAll
            ? formationsModule.getAll()
            : [];

        // 🔥 Transparent fade instead of full clear
        // This keeps previous frame data (APEXSIM trails, etc.)
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw HALO formations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Draw formation rings
        ctx.strokeStyle = "rgba(255, 60, 60, 0.7)";
        ctx.lineWidth = 1.5;

        for (const f of formations) {
            if (!f.radius) continue;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw entities (crew)
        for (const e of entities) {
            if (!e.position) continue;

            const ex = e.position.x;
            const ey = e.position.y;

            ctx.fillStyle = "rgba(255, 80, 80, 1)";
            ctx.beginPath();
            ctx.arc(ex, ey, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    APEX.register("renderer", {
        type: "renderer",
        start,
        render
    });

})();
