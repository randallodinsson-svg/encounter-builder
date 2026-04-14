/*
    APEXSIM v1.1 — Engine-Aligned
*/

(function () {

    const state = {
        particles: [],
        obstacles: [],
        running: true,
        tick: 0
    };

    function init() {
        state.particles.length = 0;
        state.obstacles.length = 0;

        for (let i = 0; i < 40; i++) {
            state.particles.push({
                x: 200 + Math.random() * 40,
                y: 200 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                size: 3 + Math.random() * 2,
                color: "rgba(0,180,255,1)"
            });
        }

        state.obstacles.push({ x: 400, y: 200, r: 40 });
        state.obstacles.push({ x: 500, y: 300, r: 30 });
        state.obstacles.push({ x: 300, y: 350, r: 50 });

        console.log("APEXSIM v1.1 — Simulation initialized");
    }

    function update(dt) {
        if (!state.running) return;

        const p = state.particles;
        const obs = state.obstacles;

        for (let i = 0; i < p.length; i++) {
            const a = p[i];

            a.x += a.vx * dt;
            a.y += a.vy * dt;

            if (a.x < 0 || a.x > 800) a.vx *= -1;
            if (a.y < 0 || a.y > 600) a.vy *= -1;

            for (let j = 0; j < obs.length; j++) {
                const o = obs[j];
                const dx = a.x - o.x;
                const dy = a.y - o.y;
                const dist = Math.hypot(dx, dy);

                if (dist < o.r + 20) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    a.vx += nx * 40 * dt;
                    a.vy += ny * 40 * dt;
                }
            }
        }

        state.tick++;
    }

    function getState() {
        return state;
    }

    APEX.register("apexsim", {
        type: "simulation",
        init,
        update,
        getState
    });

})();
