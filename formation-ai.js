/*
    APEXCORE v4.2 — Formation AI Kernel (Phase 7)
    Adds tactical intelligence, movement, cohesion, and target seeking to formations.
*/

(function () {

    // === CONFIG ===
    const MOVE_SPEED = 0.6;       // base movement speed
    const TURN_SPEED = 0.12;      // how fast formations rotate toward target
    const COHESION_STRENGTH = 0.15; // how strongly members pull toward formation center

    // === INTERNAL STATE ===
    const formationAI = new Map(); 
    // Map: formationId -> { tx, ty, facing }

    function ensureAIState(f) {
        if (!formationAI.has(f.id)) {
            formationAI.set(f.id, {
                tx: f.x,      // target x
                ty: f.y,      // target y
                facing: 0     // radians
            });
        }
        return formationAI.get(f.id);
    }

    // === PUBLIC API ===
    function setFormationTarget(formation, x, y) {
        const ai = ensureAIState(formation);
        ai.tx = x;
        ai.ty = y;
    }

    // === MOVEMENT LOGIC ===
    function updateMovement(f, ai, dt) {
        const dx = ai.tx - f.x;
        const dy = ai.ty - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            const nx = dx / dist;
            const ny = dy / dist;

            f.x += nx * MOVE_SPEED * dt;
            f.y += ny * MOVE_SPEED * dt;

            // Update facing
            const targetAngle = Math.atan2(ny, nx);
            let diff = targetAngle - ai.facing;

            // Normalize angle
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));

            ai.facing += diff * TURN_SPEED;
        }
    }

    // === COHESION LOGIC ===
    function applyCohesion(f, entities) {
        for (const id of f.members) {
            const e = entities.find(ent => ent.id === id);
            if (!e) continue;

            const dx = f.x - e.x;
            const dy = f.y - e.y;

            e.x += dx * COHESION_STRENGTH;
            e.y += dy * COHESION_STRENGTH;
        }
    }

    // === MAIN UPDATE LOOP ===
    function updateFormationAI(state) {
        const formationModule = APEX.get("formations");
        const entityModule = APEX.get("entities");
        if (!formationModule || !entityModule) return;

        const formations = formationModule.all ? formationModule.all() : null;
        if (!formations) return;

        const entities = entityModule.all();
        const dt = state.delta;

        for (const f of formations) {
            const ai = ensureAIState(f);

            updateMovement(f, ai, dt);
            applyCohesion(f, entities);
        }
    }

    // === DEBUG RENDERING (OPTIONAL) ===
    function renderFormationAI(ctx) {
        const formationModule = APEX.get("formations");
        if (!formationModule || !formationModule.all) return;

        const formations = formationModule.all();

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,0,0.5)";
        ctx.lineWidth = 2;

        for (const f of formations) {
            const ai = formationAI.get(f.id);
            if (!ai) continue;

            // Draw facing direction
            const fx = f.x + Math.cos(ai.facing) * 50;
            const fy = f.y + Math.sin(ai.facing) * 50;

            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(fx, fy);
            ctx.stroke();
        }

        ctx.restore();
    }

    // === MODULE REGISTRATION ===
    const FormationAIModule = {
        type: "formation-ai",
        update(state) {
            updateFormationAI(state);
        },
        render(ctx) {
            renderFormationAI(ctx);
        },
        setTarget: setFormationTarget
    };

    if (typeof APEX !== "undefined") {
        APEX.register("formation-ai", FormationAIModule);
        console.log("APEXCORE v4.2 — Formation AI Kernel registered");
    } else {
        console.warn("APEXCORE v4.2 — Formation AI Kernel: APEX core not found.");
    }

})();
