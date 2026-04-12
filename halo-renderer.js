// HALO-RENDERER — Upgraded visual agent swarm renderer for APEXSIM/APEXCORE

export const HaloRenderer = {
    meta: {
        name: "halo-renderer",
        version: "1.1.0",
        author: "VECTORCORE",
        description: "Upgraded canvas-based visual swarm of HALO agents with camera, trails, and debug overlays.",
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

        // --- CAMERA / STATE ---------------------------------------------------
        ctx.state = ctx.state || {};
        ctx.state.canvas = canvas;
        ctx.state.ctx2d = ctx2d;

        const rect = container.getBoundingClientRect();
        ctx.state.camera = {
            x: rect.width / 2,
            y: rect.height / 2,
            zoom: 1.0
        };

        ctx.state.center = { x: rect.width / 2, y: rect.height / 2 };

        function applyCanvasSize() {
            const dpr = window.devicePixelRatio || 1;
            const r = container.getBoundingClientRect();
            canvas.width = r.width * dpr;
            canvas.height = r.height * dpr;

            ctx2d.setTransform(1, 0, 0, 1, 0, 0);
            ctx2d.scale(dpr, dpr);

            ctx.state.center.x = r.width / 2;
            ctx.state.center.y = r.height / 2;
        }

        applyCanvasSize();

        ctx.state.resizeHandler = () => applyCanvasSize();
        window.addEventListener("resize", ctx.state.resizeHandler);

        // --- AGENTS -----------------------------------------------------------
        const AGENT_COUNT = 32;
        const agents = [];
        ctx.state.agents = agents;

        function randRange(min, max) {
            return min + Math.random() * (max - min);
        }

        // Leader agent (brighter, more obvious)
        const leader = {
            x: ctx.state.center.x,
            y: ctx.state.center.y,
            vx: 0,
            vy: 0,
            radius: 12,
            color: "#38bdf8"
        };
        ctx.state.leader = leader;

        for (let i = 0; i < AGENT_COUNT; i++) {
            const angle = (i / AGENT_COUNT) * Math.PI * 2;
            const dist = randRange(60, 160);
            agents.push({
                x: ctx.state.center.x + Math.cos(angle) * dist,
                y: ctx.state.center.y + Math.sin(angle) * dist,
                vx: randRange(-0.3, 0.3),
                vy: randRange(-0.3, 0.3),
                radius: randRange(4, 6),
                color: "rgba(191, 219, 254, 0.95)"
            });
        }

        let lastTime = performance.now();

        // --- CAMERA HELPERS ---------------------------------------------------
        function worldToScreen(x, y) {
            const cam = ctx.state.camera;
            return {
                x: ctx.state.center.x + (x - cam.x) * cam.zoom,
                y: ctx.state.center.y + (y - cam.y) * cam.zoom
            };
        }

        // --- UPDATE -----------------------------------------------------------
        function update(dt) {
            const t = performance.now() * 0.001;

            // Leader orbit (larger radius for visibility)
            const orbitRadius = 70;
            const orbitSpeed = 0.6;
            leader.x = ctx.state.center.x + Math.cos(t * orbitSpeed) * orbitRadius;
            leader.y = ctx.state.center.y + Math.sin(t * orbitSpeed) * orbitRadius;

            // Camera gently tracks leader
            const cam = ctx.state.camera;
            const camFollow = 0.06;
            cam.x += (leader.x - cam.x) * camFollow;
            cam.y += (leader.y - cam.y) * camFollow;

            // Agents
            for (const a of agents) {
                const dx = leader.x - a.x;
                const dy = leader.y - a.y;
                const dist = Math.hypot(dx, dy) || 1;

                const attractStrength = 0.05;
                a.vx += (dx / dist) * attractStrength;
                a.vy += (dy / dist) * attractStrength;

                const wanderStrength = 0.06;
                a.vx += (Math.random() - 0.5) * wanderStrength;
                a.vy += (Math.random() - 0.5) * wanderStrength;

                const damping = 0.9;
                a.vx *= damping;
                a.vy *= damping;

                a.x += a.vx * dt * 0.06;
                a.y += a.vy * dt * 0.06;
            }
        }

        // --- DRAW -------------------------------------------------------------
        function draw() {
            const r = container.getBoundingClientRect();
            const cam = ctx.state.camera;

            // Motion trails: fade instead of hard clear
            ctx2d.save();
            ctx2d.globalCompositeOperation = "source-over";
            ctx2d.fillStyle = "rgba(15, 23, 42, 0.35)";
            ctx2d.fillRect(0, 0, r.width, r.height);
            ctx2d.restore();

            // Background halo
            ctx2d.save();
            const bgGrad = ctx2d.createRadialGradient(
                ctx.state.center.x,
                ctx.state.center.y,
                0,
                ctx.state.center.x,
                ctx.state.center.y,
                Math.max(r.width, r.height) * 0.7
            );
            bgGrad.addColorStop(0, "rgba(15, 23, 42, 0.95)");
            bgGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
            ctx2d.fillStyle = bgGrad;
            ctx2d.fillRect(0, 0, r.width, r.height);
            ctx2d.restore();

            // Leader glow (stronger, clearer)
            const leaderScreen = worldToScreen(leader.x, leader.y);
            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.arc(leaderScreen.x, leaderScreen.y, leader.radius * 3.0, 0, Math.PI * 2);
            ctx2d.fillStyle = "rgba(56, 189, 248, 0.25)";
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.arc(leaderScreen.x, leaderScreen.y, leader.radius * 1.4, 0, Math.PI * 2);
            ctx2d.fillStyle = leader.color;
            ctx2d.shadowColor = "rgba(56, 189, 248, 0.9)";
            ctx2d.shadowBlur = 18;
            ctx2d.fill();
            ctx2d.restore();

            // Orbit ring for context
            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.strokeStyle = "rgba(51, 65, 85, 0.7)";
            ctx2d.lineWidth = 1;
            ctx2d.setLineDash([4, 4]);
            const orbitRadius = 70 * cam.zoom;
            ctx2d.arc(ctx.state.center.x, ctx.state.center.y, orbitRadius, 0, Math.PI * 2);
            ctx2d.stroke();
            ctx2d.restore();

            // Agents (brighter, with outlines)
            ctx2d.save();
            ctx2d.shadowColor = "rgba(148, 163, 184, 0.8)";
            ctx2d.shadowBlur = 8;
            for (const a of agents) {
                const p = worldToScreen(a.x, a.y);
                ctx2d.beginPath();
                ctx2d.arc(p.x, p.y, a.radius * cam.zoom, 0, Math.PI * 2);
                ctx2d.fillStyle = a.color;
                ctx2d.fill();

                ctx2d.lineWidth = 1;
                ctx2d.strokeStyle = "rgba(15, 23, 42, 0.9)";
                ctx2d.stroke();
            }
            ctx2d.restore();

            // Debug overlay: center + FPS-ish indicator
            ctx2d.save();
            ctx2d.fillStyle = "rgba(148, 163, 184, 0.9)";
            ctx2d.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
            ctx2d.textBaseline = "top";
            ctx2d.fillText("HALO VISUAL LAYER v1", 10, 8);
            ctx2d.fillText(`Agents: ${agents.length}`, 10, 24);
            ctx2d.fillText(`Zoom: ${cam.zoom.toFixed(2)}`, 10, 40);
            ctx2d.restore();
        }

        // --- LOOP -------------------------------------------------------------
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

        if (ctx.state && ctx.state.rafId) {
            cancelAnimationFrame(ctx.state.rafId);
            ctx.state.rafId = null;
        }

        if (ctx.state && ctx.state.resizeHandler) {
            window.removeEventListener("resize", ctx.state.resizeHandler);
            ctx.state.resizeHandler = null;
        }

        core.set(`${ns}.status`, "stopped");
    },

    reload(core, ctx) {
        const ns = ctx.meta.namespace;
        core.set(`${ns}.status`, "reloaded");
    }
};
