/*
    APEXSIM Renderer v1.0
    - Draws particles, trails, debug vectors, obstacles
    - Renders on top of HALO but below UI Deck
*/

(function () {

    let ctx = null;
    let canvas = null;

    function start() {
        canvas = document.getElementById("haloCanvas");
        if (!canvas) {
            console.warn("APEXSIM Renderer — canvas not found");
            return;
        }

        ctx = canvas.getContext("2d");
        console.log("APEXSIM Renderer v1.0 initialized");
    }

    function render() {
        if (!ctx) return;

        const sim = APEX.get("apexsim");
        if (!sim || !sim.getState) return;

        const state = sim.getState();
        const p = state.particles;
        const obs = state.obstacles;

        // Trails
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Obstacles
        ctx.strokeStyle = "rgba(255,80,80,0.4)";
        ctx.lineWidth = 2;
        for (const o of obs) {
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Particles
        for (const a of p) {
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    APEX.register("apexsim-renderer", {
        type: "renderer",
        start,
        render
    });

})();
