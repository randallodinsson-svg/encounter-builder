function update(state) {
    const formations = APEX.get("formations");
    const entities = APEX.get("entities");

    if (!formations || !entities) return;
    if (typeof formations.all !== "function" || typeof entities.all !== "function") return;

    const forms = formations.all();
    const ents = entities.all();
    if (!forms || forms.length === 0 || !ents || ents.length === 0) return;

    const dt = (state.delta || 16.67) / 1000;
    const speed = 40;

    for (const f of forms) {
        if (!f) continue;

        const dx = target.x - f.x;
        const dy = target.y - f.y;
        const dist = Math.hypot(dx, dy);

        // STOP when close enough
        if (dist > 2) {
            const vx = (dx / dist) * speed;
            const vy = (dy / dist) * speed;

            f.x += vx * dt;
            f.y += vy * dt;
        }

        const members = f.members || [];
        const memberCount = members.length || ents.length;

        for (let i = 0; i < memberCount; i++) {
            const e = members[i] || ents[i];
            if (!e) continue;

            const angle = (Math.PI * 2 * i) / memberCount;
            const offsetX = Math.cos(angle) * (f.radius || 80);
            const offsetY = Math.sin(angle) * (f.radius || 80);

            const slotX = f.x + offsetX;
            const slotY = f.y + offsetY;

            const ex = slotX - e.x;
            const ey = slotY - e.y;
            const edist = Math.hypot(ex, ey) || 1;

            const followSpeed = e.speed || 60;
            e.vx = (ex / edist) * followSpeed;
            e.vy = (ey / edist) * followSpeed;
        }
    }
}
