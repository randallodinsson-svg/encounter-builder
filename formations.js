/*
    APEXCORE v4.2 — Formation System (Updated for Phase 7)
    Groups entities into tactical formations with simple layouts.
*/

(function () {
    const formations = [];
    let nextFormationId = 1;

    // === CREATE FORMATION ===
    function createFormation(type = "circle") {
        const f = {
            id: nextFormationId++,
            type,
            members: [],
            x: 400,
            y: 300,
            radius: 80,
            spacing: 40
        };
        formations.push(f);
        return f;
    }

    // === ADD MEMBER ===
    function addMember(formation, entity) {
        if (!formation.members.includes(entity.id)) {
            formation.members.push(entity.id);
        }
    }

    // === LAYOUT: CIRCLE ===
    function layoutCircle(formation, entities) {
        const count = formation.members.length;
        if (count === 0) return;

        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const id = formation.members[i];
            const e = entities.find(ent => ent.id === id);
            if (!e) continue;

            const angle = i * angleStep;
            e.x = formation.x + Math.cos(angle) * formation.radius;
            e.y = formation.y + Math.sin(angle) * formation.radius;
        }
    }

    // === LAYOUT: LINE ===
    function layoutLine(formation, entities) {
        const count = formation.members.length;
        if (count === 0) return;

        const startX = formation.x - ((count - 1) * formation.spacing) / 2;

        for (let i = 0; i < count; i++) {
            const id = formation.members[i];
            const e = entities.find(ent => ent.id === id);
            if (!e) continue;

            e.x = startX + i * formation.spacing;
            e.y = formation.y;
        }
    }

    // === LAYOUT: WEDGE ===
    function layoutWedge(formation, entities) {
        const count = formation.members.length;
        if (count === 0) return;

        const mid = Math.floor(count / 2);

        for (let i = 0; i < count; i++) {
            const id = formation.members[i];
            const e = entities.find(ent => ent.id === id);
            if (!e) continue;

            const offset = i - mid;
            e.x = formation.x + offset * formation.spacing;
            e.y = formation.y + Math.abs(offset) * 20;
        }
    }

    // === UPDATE FORMATIONS ===
    function updateFormations(state) {
        const entityModule = APEX.get("entities");
        if (!entityModule) return;

        const entities = entityModule.all();

        for (const f of formations) {
            switch (f.type) {
                case "circle":
                    layoutCircle(f, entities);
                    break;
                case "line":
                    layoutLine(f, entities);
                    break;
                case "wedge":
                    layoutWedge(f, entities);
                    break;
            }
        }
    }

    // === RENDER FORMATIONS ===
    function renderFormations(ctx) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,255,180,0.35)";
        ctx.lineWidth = 1;

        for (const f of formations) {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    // === REQUIRED FOR PHASE 7 AI ===
    function allFormations() {
        return formations;
    }

    // === MODULE EXPORT ===
    const FormationModule = {
        type: "formations",
        update(state) {
            updateFormations(state);
        },
        render(ctx) {
            renderFormations(ctx);
        },
        create: createFormation,
        addMember,
        all: allFormations   // <-- THIS is what Phase 7 needed
    };

    if (typeof APEX !== "undefined") {
        APEX.register("formations", FormationModule);
        console.log("APEXCORE v4.2 — Formation System (Updated) registered");
    } else {
        console.warn("APEXCORE v4.2 — Formation System: APEX core not found.");
    }
})();
