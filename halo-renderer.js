// HALO-RENDERER — Visual agent swarm renderer for APEXSIM/APEXCORE

export const HaloRenderer = {
    meta: {
        name: "halo-renderer",
        version: "1.0.0",
        author: "VECTORCORE",
        description: "Canvas-based visual swarm of HALO agents orbiting and wandering.",
        namespace: "halo",
        capabilities: ["render", "sim", "ops"]
    },

    init(core, ctx) {
        const ns = ctx.meta.namespace;

        const canvas = document.getElementById("haloCanvas");
        const container = document.getElementById("haloContainer");

        if (!canvas || !container) {
            console.warn("[HALO-RENDERER] canvas or container missing");
            core.set(`${ns}.status`, "error: no canvas");
            return;
        }

        const ctx2d = canvas.getContext("2d");

        function applyCanvasSize() {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx2d.setTransform(1, 0, 0, 1, 0, 0);
            ctx2d.scale(dpr, dpr);

            ctx.state.center.x = rect.width / 2;
            ctx.state.center.y = rect.height / 2;
        }

        // Initial sizing
        const rect = container.getBoundingClientRect();
        ctx.state = {
            canvas,
            ctx2d,
            center: { x: rect.width / 2, y: rect.height / 2 }
        };

        applyCanvasSize();

        // Store resize handler so destroy() can remove it
        ctx.state.resizeHandler = () => applyCanvasSize();
        window.addEventListener("resize", ctx.state.resizeHandler);

        const AGENT_COUNT = 32;
        const agents = [];
        ctx.state.agents = agents;

        function randRange(min, max) {
            return min + Math.random() * (max - min);
        }

        // Leader agent
        const leader = {
            x: ctx.state.center.x,
            y: ctx.state.center.y,
            vx: 0,
            vy: 0,
            radius: 10,
            color: "#38bdf8"
        };
        ctx.state.leader = leader;

        for (let i = 0; i < AGENT_COUNT; i++) {
            const angle = (i / AGENT_COUNT) * Math.PI * 2;
            const dist = randRange(40, 120);
            agents.push({
                x: ctx.state.center.x + Math.cos(angle) * dist,
                y: ctx.state.center.y + Math.sin(angle) * dist,
                vx: randRange(-0.2, 0.2),
                vy: randRange(-0.2, 0.2),
                radius: randRange(3, 5),
                orbitOffset: randRange(-Math.PI, Math.PI),
                color: "rgba(148, 163, 184, 0.9)"
            });
        }

        let lastTime = performance.now();

        function update(dt) {
            const t = performance.now() * 0.001;

            // Leader orbit
            const orbitRadius = 40;
            const orbitSpeed = 0.6;
            leader.x = ctx.state.center.x + Math.cos(t * orbitSpeed) * orbitRadius;
            leader.y = ctx.state.center.y + Math.sin(t * orbitSpeed) * orbitRadius;

            // Agents
            for (const a of agents) {
                const dx = leader.x - a.x;
                const dy = leader.y - a.y;
                const dist = Math.hypot(dx, dy) || 1;

                const attractStrength = 0.04;
                a.vx += (dx / dist) * attractStrength;
                a.vy += (dy / dist) * attractStrength;

                const wanderStrength = 0.05;
                a.vx += (Math.random() - 0.5) * wanderStrength;
                a.vy += (Math.random() - 0.5) * wanderStrength;

                const damping = 0.92;
                a.vx *= damping;
                a.vy *= damping;

                a.x += a.vx * dt * 0.06;
                a.y += a.vy * dt * 0.06;
            }
        }

        function draw() {
            const r = container.getBoundingClientRect();
            ctx2d.clearRect(0, 0, r.width, r.height);

            // Background halo
            ctx2d.save();
            const gradient = ctx2d.createRadialGradient(
                ctx.state.center.x, ctx.state.center.y, 0,
                ctx.state.center.x, ctx.state.center.y, Math.max(r.width, r.height) * 0.6
            );
            gradient.addColorStop(0, "rgba(15, 23, 42, 0.9)");
            gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
            ctx2d.fillStyle = gradient;
            ctx2d.fillRect(0, 0, r.width, r.height);
            ctx2d.restore();

            // Leader glow
            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.arc(leader.x, leader.y, leader.radius * 2.4, 0, Math.PI * 2);
            ctx2d.fillStyle = "rgba(56, 189, 248, 0.18)";
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.arc(leader.x, leader.y, leader.radius, 0, Math.PI * 2);
            ctx2d.fillStyle = leader.color;
            ctx2d.fill();
            ctx2d.restore();

            // Agents
            ctx2d.save();
            for (const a of agents) {
                ctx2d.beginPath();
                ctx2d.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx2d.fillStyle = a.color;
                ctx2d.fill();
            }
            ctx2d.restore();
        }

        function loop(now) {
            const dt = now - lastTime;
            lastTime = now;

            update(dt);
            draw();

            ctx.state.rafId = requestAnimationFrame(loop);
        }

        ctx.state.rafId = requestAnimationFrame(loop);

        core.set(`${ns}.status`, "running");
        core.set(`${ns}.agentCount`, AGENT_COUNT);
    },

    tick(tickData, core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.lastTick`, tickData.count ?? null);
        core.set(`${ns}.lastUpdate`, tickData.time ?? null);
    },

    destroy(core, ctx) {
        const ns = ctx.meta.namespace;

        if (ctx.state.rafId) {
            cancelAnimationFrame(ctx.state.rafId);
        }

        if (ctx.state.resizeHandler) {
            window.removeEventListener("resize", ctx.state.resizeHandler);
        }

        core.set(`${ns}.status`, "stopped");
    },

    reload(core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "reloaded");
    }
};
