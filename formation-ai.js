/*
    APEXCORE v4.2 — Formation AI (B1-A Clean Tactical Sim)
*/

(function () {

    const target = { x: 800, y: 300 };

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
        const moveSpeed = 60;

        for (const f of forms) {
            // Move formation anchor toward target with easing and stop band
            const dx = target.x - f.x;
            const dy = target.y - f.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 2) {
                const t = Math.min(dist / 200, 1); // easing factor
                const easedSpeed = moveSpeed * (0.4 + 0.6 * t);

                f.x += (dx / (dist || 1)) * easedSpeed * dt;
                f.y += (dy / (dist || 1)) * easedSpeed * dt;
            }

            const members = f.members;
            const count = members.length;
            if (!count) continue;

            for (let i = 0; i < count; i++) {
                const e = members[i];
                if (!e) continue;

                const angle = (Math.PI * 2 * i) / count;

                const slotX = f.x + Math.cos(angle) * f.radius;
                const slotY = f.y + Math.sin(angle) * f.radius;

                const ex = slotX - e.x;
                const ey = slotY - e.y;
                const edist = Math.hypot(ex, ey) || 1;

                const followSpeed = e.speed || 80;

                // Smooth follow toward slot
                e.vx = (ex / edist) * followSpeed;
                e.vy = (ey / edist) * followSpeed;
            }
        }
    }

    APEX.register("formation-ai", {
        type: "formation-ai",
        setTarget,
        update
    });

})();
