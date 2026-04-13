/*
    APEXCORE v4.2 — Formation AI (FULLNUKE Edition)
*/

(function () {

    let target = { x: 800, y: 300 };

    function setTarget(x, y) {
        target.x = x;
        target.y = y;
    }

    function update(state) {
        const formations = APEX.get("formations");
        const entities = APEX.get("entities");

        if (!formations || !entities) return;

        const forms = formations.all();
        const ents = entities.all();
        if (!forms.length || !ents.length) return;

        const dt = (state.delta || 16.67) / 1000;
        const speed = 40;

        for (const f of forms) {

            const dx = target.x - f.x;
            const dy = target.y - f.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 2) {
                f.x += (dx / dist) * speed * dt;
                f.y += (dy / dist) * speed * dt;
            }

            const members = f.members;
            const count = members.length;

            for (let i = 0; i < count; i++) {
                const e = members[i];
                const angle = (Math.PI * 2 * i) / count;

                const slotX = f.x + Math.cos(angle) * f.radius;
                const slotY = f.y + Math.sin(angle) * f.radius;

                const ex = slotX - e.x;
                const ey = slotY - e.y;
                const edist = Math.hypot(ex, ey) || 1;

                e.vx = (ex / edist) * e.speed;
                e.vy = (ey / edist) * e.speed;
            }
        }
    }

    APEX.register("formation-ai", { type: "formation-ai", setTarget, update });

})();
