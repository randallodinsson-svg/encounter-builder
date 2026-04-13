/*
    APEXCORE v4.4 — Formation AI (Classic HALO, Stable Orbit)
    - Fixed ring
    - Smooth easing into slots
    - No collapse, no drift, no disappearing dots
*/

(function () {

    // Classic HALO anchor position (center-ish)
    const target = { x: 350, y: 250 };

    function setTarget(x, y) {
        target.x = x;
        target.y = y;
    }

    function update(state) {
        const formations = APEX.get("formations");
        const entities = APEX.get("entities");

        if (!formations || !entities) return;
        if (typeof formations.all !== "function" || typeof entities.all !== "function") return;

        const forms = formations.all();
        const ents = entities.all();
        if (!forms.length || !ents.length) return;

        const dt = (state.delta || 16.67) / 1000;

        for (const f of forms) {
            // Anchor stays locked on target for Classic HALO
            f.x = target.x;
            f.y = target.y;

            const members = f.members;
            const count = members.length;
            if (!count) continue;

            for (let i = 0; i < count; i++) {
                const e = members[i];
                if (!e) continue;

                // Fixed slot angle for Classic HALO
                const angle = (Math.PI * 2 * i) / count;

                const slotX = f.x + Math.cos(angle) * f.radius;
                const slotY = f.y + Math.sin(angle) * f.radius;

                const ex = slotX - e.x;
                const ey = slotY - e.y;
                const edist = Math.hypot(ex, ey) || 1;

                // If close enough, snap and stop
                const snapThreshold = 2.0;
                if (edist < snapThreshold) {
                    e.x = slotX;
                    e.y = slotY;
                    e.vx = 0;
                    e.vy = 0;
                    continue;
                }

                // Smooth easing toward slot
                const followSpeed = e.speed || 80;
                const maxStep = followSpeed * dt;

                // Clamp movement so they don't overshoot
                const step = Math.min(maxStep, edist);
                const nx = ex / edist;
                const ny = ey / edist;

                e.vx = nx * followSpeed;
                e.vy = ny * followSpeed;

                e.x += nx * step;
                e.y += ny * step;
            }
        }
    }

    APEX.register("formation-ai", {
        type: "formation-ai",
        setTarget,
        update
    });

})();
