// HALO-RENDERER — B2‑X Extreme Aggression Tactical Swarm + Tier 1 Tactical Overlays (Soft Gradient Cone)

export const HaloRenderer = {
    meta: {
        name: "halo-renderer",
        version: "2.1.0",
        author: "VECTORCORE",
        description: "Extreme-aggression tactical swarm with flocking, camera, trails, and Tier 1 tactical overlays.",
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
        ctx.state = ctx.state || {};
        ctx.state.canvas = canvas;
        ctx.state.ctx2d = ctx2d;

        // Initial sizing
        const rect = container.getBoundingClientRect();
        const center = { x: rect.width / 2, y: rect.height / 2 };
        ctx.state.center = center;

        function applyCanvasSize() {
            const dpr = window.devicePixelRatio || 1;
            const r = container.getBoundingClientRect();
            canvas.width = r.width * dpr;
            canvas.height = r.height * dpr;

            ctx2d.setTransform(1, 0, 0, 1, 0, 0);
            ctx2d.scale(dpr, dpr);

            center.x = r.width / 2;
            center.y = r.height / 2;
        }

        applyCanvasSize();
        ctx.state.resizeHandler = () => applyCanvasSize();
        window.addEventListener("resize", ctx.state.resizeHandler);

        // Camera
        ctx.state.camera = {
            x: center.x,
            y: center.y,
            zoom: 1.0
        };

        // Random helper
        function randRange(min, max) {
            return min + Math.random() * (max - min);
        }

        // Leader
        const leader = {
            x: center.x,
            y: center.y,
            vx: 0,
            vy: 0,
            radius: 13,
            color: "#38bdf8"
        };
        ctx.state.leader = leader;

        // Agents
        const AGENT_COUNT = 32;
        const agents = [];
        ctx.state.agents = agents;

        for (let i = 0; i < AGENT_COUNT; i++) {
            const angle = (i / AGENT_COUNT) * Math.PI * 2;
            const dist = randRange(80, 200);
            agents.push({
                x: center.x + Math.cos(angle) * dist,
                y: center.y + Math.sin(angle) * dist,
                vx: randRange(-0.4, 0.4),
                vy: randRange(-0.4, 0.4),
                radius: randRange(4.5, 6.5),
                color: "rgba(219, 234, 254, 0.98)"
            });
        }

        // Flocking parameters — B2‑X Extreme Aggression
        const params = {
            neighborRadius: 140,
            separationRadius: 55,
            maxSpeed: 2.4,
            maxForce: 0.16,

            weightSeparation: 2.4,
            weightAlignment: 1.6,
            weightCohesion: 1.8,

            leaderAttractRadius: 260,
            leaderAttractWeight: 2.2,

            wanderStrength: 0.22,
            damping: 0.90
        };
        ctx.state.params = params;

        let lastTime = performance.now();

        // World → Screen
        function worldToScreen(x, y) {
            const cam = ctx.state.camera;
            return {
                x: center.x + (x - cam.x) * cam.zoom,
                y: center.y + (y - cam.y) * cam.zoom
            };
        }

        // Vector helpers
        function limit(vec, max) {
            const mag = Math.hypot(vec.x, vec.y);
            if (mag > max && mag > 0) {
                const scale = max / mag;
                vec.x *= scale;
                vec.y *= scale;
            }
        }

        // Flocking forces
        function computeFlockingForces(agent, agents, leader, params) {
            let count = 0;
            let sepCount = 0;

            const cohesion = { x: 0, y: 0 };
            const alignment = { x: 0, y: 0 };
            const separation = { x: 0, y: 0 };

            for (const other of agents) {
                if (other === agent) continue;

                const dx = other.x - agent.x;
                const dy = other.y - agent.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= 0) continue;

                if (dist < params.neighborRadius) {
                    cohesion.x += other.x;
                    cohesion.y += other.y;

                    alignment.x += other.vx;
                    alignment.y += other.vy;

                    count++;

                    if (dist < params.separationRadius) {
                        separation.x -= dx / dist;
                        separation.y -= dy / dist;
                        sepCount++;
                    }
                }
            }

            const steer = { sep: { x: 0, y: 0 }, ali: { x: 0, y: 0 }, coh: { x: 0, y: 0 } };

            if (count > 0) {
                cohesion.x /= count;
                cohesion.y /= count;
                cohesion.x -= agent.x;
                cohesion.y -= agent.y;
                limit(cohesion, params.maxForce);
                steer.coh = cohesion;

                alignment.x /= count;
                alignment.y /= count;
                limit(alignment, params.maxForce);
                steer.ali = alignment;
            }

            if (sepCount > 0) {
                separation.x /= sepCount;
                separation.y /= sepCount;
                limit(separation, params.maxForce * 1.4);
                steer.sep = separation;
            }

            // Leader attraction
            const ldx = leader.x - agent.x;
            const ldy = leader.y - agent.y;
            const ldist = Math.hypot(ldx, ldy) || 1;
            const leaderForce = { x: 0, y: 0 };
            if (ldist < params.leaderAttractRadius) {
                leaderForce.x = (ldx / ldist) * params.leaderAttractWeight * params.maxForce;
                leaderForce.y = (ldy / ldist) * params.leaderAttractWeight * params.maxForce;
            }

            return { steer, leaderForce };
        }

        // UPDATE
        function update(dt) {
            const t = performance.now() * 0.001;
            const cam = ctx.state.camera;

            // Leader orbit
            const orbitRadius = 110;
            const orbitSpeed = 0.95;
            leader.x = center.x + Math.cos(t * orbitSpeed) * orbitRadius;
            leader.y = center.y + Math.sin(t * orbitSpeed) * orbitRadius;

            // Camera follow
            const camFollow = 0.10;
            cam.x += (leader.x - cam.x) * camFollow;
            cam.y += (leader.y - cam.y) * camFollow;

            const dtScale = dt * 0.06;

            for (const a of agents) {
                const { steer, leaderForce } = computeFlockingForces(a, agents, leader, params);

                a.vx += steer.sep.x * params.weightSeparation;
                a.vy += steer.sep.y * params.weightSeparation;

                a.vx += steer.ali.x * params.weightAlignment;
                a.vy += steer.ali.y * params.weightAlignment;

                a.vx += steer.coh.x * params.weightCohesion;
                a.vy += steer.coh.y * params.weightCohesion;

                a.vx += leaderForce.x;
                a.vy += leaderForce.y;

                a.vx += (Math.random() - 0.5) * params.wanderStrength;
                a.vy += (Math.random() - 0.5) * params.wanderStrength;

                a.vx *= params.damping;
                a.vy *= params.damping;
                limit(a, params.maxSpeed);

                a.x += a.vx * dtScale;
                a.y += a.vy * dtScale;
            }
        }

        // DRAW
        function draw() {
            const r = container.getBoundingClientRect();
            const cam = ctx.state.camera;

            // Motion trails
            ctx2d.save();
            ctx2d.globalCompositeOperation = "source-over";
            ctx2d.fillStyle = "rgba(3, 7, 18, 0.40)";
            ctx2d.fillRect(0, 0, r.width, r.height);
            ctx2d.restore();

            // Background halo
            ctx2d.save();
            const bgGrad = ctx2d.createRadialGradient(
                center.x, center.y, 0,
                center.x, center.y, Math.max(r.width, r.height) * 0.8
            );
            bgGrad.addColorStop(0, "rgba(15, 23, 42, 0.98)");
            bgGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
            ctx2d.fillStyle = bgGrad;
            ctx2d.fillRect(0, 0, r.width, r.height);
            ctx2d.restore();

            // -----------------------------
            // TIER 1 TACTICAL OVERLAYS
            // -----------------------------

            // Compute swarm centroid
            let cx = 0, cy = 0;
            for (const a of agents) {
                cx += a.x;
                cy += a.y;
            }
            cx /= agents.length;
            cy /= agents.length;
            const centroid = { x: cx, y: cy };
            const centroidScreen = worldToScreen(cx, cy);

            // 1. Leader Range Rings
            const leaderScreen = worldToScreen(leader.x, leader.y);

            ctx2d.save();
            ctx2d.lineWidth = 1.2;

            // Inner ring
            ctx2d.beginPath();
            ctx2d.strokeStyle = "rgba(56, 189, 248, 0.35)";
            ctx2d.arc(leaderScreen.x, leaderScreen.y, 90 * cam.zoom, 0, Math.PI * 2);
            ctx2d.stroke();

            // Outer ring
            ctx2d.beginPath();
            ctx2d.strokeStyle = "rgba(56, 189, 248, 0.18)";
            ctx2d.arc(leaderScreen.x, leaderScreen.y, 160 * cam.zoom, 0, Math.PI * 2);
            ctx2d.stroke();
            ctx2d.restore();

            // 2. Swarm Cohesion Ring
            let cohesionRadius = 0;
            for (const a of agents) {
                const dx = a.x - cx;
                const dy = a.y - cy;
                cohesionRadius += Math.hypot(dx, dy);
            }
            cohesionRadius /= agents.length;

            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.strokeStyle = "rgba(148, 163, 184, 0.25)";
            ctx2d.lineWidth = 1;
            ctx2d.arc(centroidScreen.x, centroidScreen.y, cohesionRadius * cam.zoom, 0, Math.PI * 2);
            ctx2d.stroke();
            ctx2d.restore();

            // 3. Velocity Vectors
            ctx2d.save();
            ctx2d.strokeStyle = "rgba(148, 163, 184, 0.55)";
            ctx2d.lineWidth = 1;
            for (const a of agents) {
                const p = worldToScreen(a.x, a.y);
                const speed = Math.hypot(a.vx, a.vy);
                const len = Math.min(18, 4 + speed * 8) * cam.zoom;

                const dirX = (a.vx / (speed || 1)) * len;
                const dirY = (a.vy / (speed || 1)) * len;

                ctx2d.beginPath();
                ctx2d.moveTo(p.x, p.y);
                ctx2d.lineTo(p.x + dirX, p.y + dirY);
                ctx2d.stroke();
            }
            ctx2d.restore();

            // 4. Soft Gradient Threat Cone
            ctx2d.save();
            const coneAngle = Math.PI * 0.33; // ~60 degrees
            const leaderDir = Math.atan2(leader.vy, leader.vx) || 0;

            const coneGrad = ctx2d.createRadialGradient(
                leaderScreen.x, leaderScreen.y, 0,
                leaderScreen.x, leaderScreen.y, 240 * cam.zoom
            );
            coneGrad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
            coneGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

            ctx2d.fillStyle = coneGrad;
            ctx2d.beginPath();
            ctx2d.moveTo(leaderScreen.x, leaderScreen.y);
            ctx2d.arc(
                leaderScreen.x,
                leaderScreen.y,
                240 * cam.zoom,
                leaderDir - coneAngle,
                leaderDir + coneAngle
            );
            ctx2d.closePath();
            ctx2d.fill();
            ctx2d.restore();

            // 5. Target Line (Leader → Centroid)
            ctx2d.save();
            ctx2d.strokeStyle = "rgba(56, 189, 248, 0.45)";
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            ctx2d.moveTo(leaderScreen.x, leaderScreen.y);
            ctx2d.lineTo(centroidScreen.x, centroidScreen.y);
            ctx2d.stroke();
            ctx2d.restore();

            // -----------------------------
            // AGENTS + LEADER RENDERING
            // -----------------------------

            // Leader glow
            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.arc(leaderScreen.x, leaderScreen.y, leader.radius * 3.4, 0, Math.PI * 2);
            ctx2d.fillStyle = "rgba(56, 189, 248, 0.30)";
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.arc(leaderScreen.x, leaderScreen.y, leader.radius * 1.6, 0, Math.PI * 2);
            ctx2d.fillStyle = leader.color;
            ctx2d.shadowColor = "rgba(56, 189, 248, 1.0)";
            ctx2d.shadowBlur = 22;
            ctx2d.fill();
            ctx2d.restore();

            // Agents
            ctx2d.save();
            ctx2d.shadowColor = "rgba(148, 163, 184, 0.9)";
            ctx2d.shadowBlur = 10;
            for (const a of agents) {
                const p = worldToScreen(a.x, a.y);

                // Velocity streak
                const speed = Math.hypot(a.vx, a.vy);
                const streakLen = Math.min(26, 6 + speed * 10);
                const dirX = (a.vx / (speed || 1)) * streakLen * cam.zoom;
                const dirY = (a.vy / (speed || 1)) * streakLen * cam.zoom;

                ctx2d.beginPath();
                ctx2d.moveTo(p.x - dirX, p.y - dirY);
                ctx2d.lineTo(p.x, p.y);
                ctx2d.strokeStyle = "rgba(148, 163, 184, 0.65)";
                ctx2d.lineWidth = 1.2;
                ctx2d.stroke();

                // Core agent
                ctx2d.beginPath();
                ctx2d.arc(p.x, p.y, a.radius * cam.zoom, 0, Math.PI * 2);
                ctx2d.fillStyle = a.color;
                ctx2d.fill();

                ctx2d.lineWidth = 1;
                ctx2d.strokeStyle = "rgba(15, 23, 42, 0.95)";
                ctx2d.stroke();
            }
            ctx2d.restore();

            // Debug overlay
            ctx2d.save();
            ctx2d.fillStyle = "rgba(148, 163, 184, 0.95)";
            ctx2d.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
            ctx2d.textBaseline = "top";
            ctx2d.fillText("HALO VISUAL LAYER v2.1 — B2‑X + TIER 1 OVERLAYS", 10, 8);
            ctx2d.fillText(`Agents: ${agents.length}`, 10, 24);
            ctx2d.fillText(`Zoom: ${cam.zoom.toFixed(2)}`, 10, 40);
            ctx2d.restore();
        }

        // LOOP
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
