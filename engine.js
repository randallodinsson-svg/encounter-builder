// APEXRPG Encounter Builder Engine
// File: engine.js

const STORAGE_KEY = "APEXRPG_ENCOUNTER_BUILDER_V1";

let creatures = [];
let encounter = [];

// ---------- Initialization ----------

document.addEventListener("DOMContentLoaded", () => {
    loadState();
    ensureDefaultCreatures();
    updateCreatureSelect();
    renderEncounter();
    calculateDifficulty();
});

// ---------- Persistence ----------

function saveState() {
    const state = {
        creatures,
        encounter,
        partySize: getNumber("partySize", 4),
        partyLevel: getNumber("partyLevel", 3)
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Unable to save state:", e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        creatures = Array.isArray(state.creatures) ? state.creatures : [];
        encounter = Array.isArray(state.encounter) ? state.encounter : [];
        if (typeof state.partySize === "number") {
            document.getElementById("partySize").value = state.partySize;
        }
        if (typeof state.partyLevel === "number") {
            document.getElementById("partyLevel").value = state.partyLevel;
        }
    } catch (e) {
        console.warn("Unable to load state:", e);
    }
}

// ---------- Helpers ----------

function getNumber(id, fallback = 0) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = parseInt(el.value, 10);
    return Number.isFinite(v) ? v : fallback;
}

function getText(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function setStatBlock(text) {
    const el = document.getElementById("statBlock");
    if (el) el.textContent = text;
}

// ---------- Default Creatures ----------

function ensureDefaultCreatures() {
    if (creatures.length > 0) return;

    creatures = [
        {
            id: "goblin_skirmisher",
            name: "Goblin Skirmisher",
            level: 1,
            role: "Skirmisher",
            hp: 18,
            ac: 14,
            speed: 6,
            abilities: "STR 10, DEX 14, CON 12, INT 8, WIS 10, CHA 8",
            traits: "Nimble Escape: The goblin can Disengage or Hide as a bonus action.",
            actions: "Scimitar +4 vs AC, 1d6+2 slashing. Shortbow +4 vs AC, 1d6+2 piercing.",
            notes: "Use as light skirmishers; harass and retreat."
        },
        {
            id: "orc_brute",
            name: "Orc Brute",
            level: 2,
            role: "Brute",
            hp: 30,
            ac: 13,
            speed: 6,
            abilities: "STR 16, DEX 12, CON 14, INT 8, WIS 10, CHA 10",
            traits: "Aggressive: As a bonus action, the orc can move up to its speed toward a hostile creature.",
            actions: "Greataxe +5 vs AC, 1d12+3 slashing.",
            notes: "Frontline bruiser; pairs well with goblins."
        },
        {
            id: "necrotic_hound",
            name: "Necrotic Hound",
            level: 3,
            role: "Skirmisher",
            hp: 40,
            ac: 15,
            speed: 8,
            abilities: "STR 14, DEX 16, CON 14, INT 3, WIS 12, CHA 6",
            traits: "Shadow Step: Can teleport up to 20 ft between dim light or darkness.",
            actions: "Bite +6 vs AC, 1d8+4 piercing + 1d6 necrotic.",
            notes: "Fast flanker; ideal for undead packs."
        }
    ];
}

// ---------- Creature Creator ----------

function createCreature() {
    const name = getText("creatureName");
    if (!name) {
        alert("Creature must have a name.");
        return;
    }

    const creature = {
        id: slugify(name),
        name,
        level: getNumber("creatureLevel", 1),
        role: getText("creatureRole") || "Brute",
        hp: getNumber("creatureHP", 10),
        ac: getNumber("creatureAC", 12),
        speed: getNumber("creatureSpeed", 6),
        abilities: getText("creatureAbilities"),
        traits: getText("creatureTraits"),
        actions: getText("creatureActions"),
        notes: getText("creatureNotes")
    };

    const existingIndex = creatures.findIndex(c => c.id === creature.id);
    if (existingIndex >= 0) {
        creatures[existingIndex] = creature;
    } else {
        creatures.push(creature);
    }

    updateCreatureSelect();
    saveState();
    setStatBlock(renderCreatureBlock(creature));
}

function clearCreatureForm() {
    document.getElementById("creatureName").value = "";
    document.getElementById("creatureLevel").value = 1;
    document.getElementById("creatureRole").value = "Brute";
    document.getElementById("creatureHP").value = 20;
    document.getElementById("creatureAC").value = 14;
    document.getElementById("creatureSpeed").value = 6;
    document.getElementById("creatureAbilities").value = "";
    document.getElementById("creatureTraits").value = "";
    document.getElementById("creatureActions").value = "";
    document.getElementById("creatureNotes").value = "";
}

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function updateCreatureSelect() {
    const select = document.getElementById("creatureSelect");
    if (!select) return;

    select.innerHTML = "";
    if (creatures.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No creatures defined";
        select.appendChild(opt);
        return;
    }

    creatures.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} (L${c.level} ${c.role})`;
        select.appendChild(opt);
    });

    select.onchange = () => {
        const id = select.value;
        const creature = creatures.find(c => c.id === id);
        if (creature) {
            setStatBlock(renderCreatureBlock(creature));
        }
    };
}

// ---------- Encounter Builder ----------

function addToEncounter() {
    const select = document.getElementById("creatureSelect");
    if (!select || !select.value) {
        alert("Select a creature first.");
        return;
    }

    const creature = creatures.find(c => c.id === select.value);
    if (!creature) {
        alert("Creature not found.");
        return;
    }

    const qty = getNumber("creatureQuantity", 1);
    if (qty <= 0) {
        alert("Quantity must be at least 1.");
        return;
    }

    const existing = encounter.find(e => e.creatureId === creature.id);
    if (existing) {
        existing.quantity += qty;
    } else {
        encounter.push({
            creatureId: creature.id,
            quantity: qty
        });
    }

    renderEncounter();
    calculateDifficulty();
    saveState();
}

function clearEncounter() {
    if (!confirm("Clear the current encounter?")) return;
    encounter = [];
    renderEncounter();
    calculateDifficulty();
    saveState();
}

function renderEncounter() {
    const container = document.getElementById("encounterList");
    if (!container) return;

    if (encounter.length === 0) {
        container.textContent = "No creatures in encounter.";
        return;
    }

    container.innerHTML = "";
    encounter.forEach(entry => {
        const creature = creatures.find(c => c.id === entry.creatureId);
        if (!creature) return;

        const row = document.createElement("div");
        row.className = "encounter-row";

        const main = document.createElement("div");
        main.className = "encounter-row-main";

        const name = document.createElement("div");
        name.className = "encounter-row-name";
        name.textContent = `${entry.quantity} × ${creature.name}`;

        const meta = document.createElement("div");
        meta.className = "encounter-row-meta";
        meta.textContent = `Level ${creature.level} ${creature.role} — HP ${creature.hp}, AC ${creature.ac}`;

        main.appendChild(name);
        main.appendChild(meta);

        const actions = document.createElement("div");
        const btnView = document.createElement("button");
        btnView.textContent = "View";
        btnView.onclick = () => setStatBlock(renderCreatureBlock(creature));

        const btnRemove = document.createElement("button");
        btnRemove.textContent = "Remove";
        btnRemove.className = "danger";
        btnRemove.onclick = () => {
            encounter = encounter.filter(e => e !== entry);
            renderEncounter();
            calculateDifficulty();
            saveState();
        };

        actions.appendChild(btnView);
        actions.appendChild(btnRemove);

        row.appendChild(main);
        row.appendChild(actions);
        container.appendChild(row);
    });
}

// ---------- Difficulty Calculation ----------

function calculateDifficulty() {
    const partySize = getNumber("partySize", 4);
    const partyLevel = getNumber("partyLevel", 3);

    const totalXP = encounter.reduce((sum, entry) => {
        const creature = creatures.find(c => c.id === entry.creatureId);
        if (!creature) return sum;
        const xp = estimateXP(creature.level, creature.role);
        return sum + xp * entry.quantity;
    }, 0);

    const baselineXP = partySize * estimateXP(partyLevel, "Standard");
    const ratio = baselineXP > 0 ? totalXP / baselineXP : 0;

    const output = document.getElementById("difficultyOutput");
    if (!output) return;

    let label = "Trivial";
    let cssClass = "difficulty-easy";

    if (ratio < 0.5) {
        label = "Trivial";
        cssClass = "difficulty-easy";
    } else if (ratio < 1.0) {
        label = "Easy";
        cssClass = "difficulty-easy";
    } else if (ratio < 1.5) {
        label = "Moderate";
        cssClass = "difficulty-moderate";
    } else if (ratio < 2.0) {
        label = "Hard";
        cssClass = "difficulty-hard";
    } else {
        label = "Deadly";
        cssClass = "difficulty-deadly";
    }

    output.innerHTML = "";
    const line = document.createElement("div");
    line.textContent = `Total XP: ${totalXP} vs Party Baseline: ${baselineXP} (Ratio: ${ratio.toFixed(2)})`;
    output.appendChild(line);

    const tag = document.createElement("span");
    tag.className = `difficulty-tag ${cssClass}`;
    tag.textContent = label;
    output.appendChild(tag);

    saveState();
}

function estimateXP(level, role) {
    // Simple heuristic XP table
    const base = Math.max(25, level * 50);
    switch (role) {
        case "Brute": return Math.round(base * 1.1);
        case "Skirmisher": return Math.round(base * 1.0);
        case "Artillery": return Math.round(base * 1.1);
        case "Controller": return Math.round(base * 1.2);
        case "Support": return Math.round(base * 0.9);
        case "Elite": return Math.round(base * 2.0);
        case "Solo": return Math.round(base * 4.0);
        default: return base;
    }
}

// ---------- Stat Block Rendering ----------

function renderCreatureBlock(c) {
    return [
        `${c.name} — Level ${c.level} ${c.role}`,
        `HP ${c.hp}; AC ${c.ac}; Speed ${c.speed}`,
        "",
        c.abilities ? `Abilities: ${c.abilities}` : "",
        c.traits ? `Traits:\n${c.traits}` : "",
        c.actions ? `Actions:\n${c.actions}` : "",
        c.notes ? `Notes:\n${c.notes}` : ""
    ].filter(Boolean).join("\n\n");
}

// ---------- Templates ----------

function applyTemplate(templateId) {
    switch (templateId) {
        case "goblinWarband":
            applyGoblinWarband();
            break;
        case "raiderPatrol":
            applyRaiderPatrol();
            break;
        case "undeadPack":
            applyUndeadPack();
            break;
        case "eliteStrikeTeam":
            applyEliteStrikeTeam();
            break;
        case "beastAmbush":
            applyBeastAmbush();
            break;
        default:
            alert("Unknown template: " + templateId);
    }
    renderEncounter();
    calculateDifficulty();
    saveState();
}

function applyGoblinWarband() {
    ensureDefaultCreatures();
    encounter = [];

    const goblin = creatures.find(c => c.id === "goblin_skirmisher");
    const orc = creatures.find(c => c.id === "orc_brute");

    if (goblin) {
        encounter.push({ creatureId: goblin.id, quantity: 6 });
        setStatBlock(renderCreatureBlock(goblin));
    }
    if (orc) {
        encounter.push({ creatureId: orc.id, quantity: 2 });
    }
}

function applyRaiderPatrol() {
    ensureDefaultCreatures();
    encounter = [];

    const orc = creatures.find(c => c.id === "orc_brute");
    const goblin = creatures.find(c => c.id === "goblin_skirmisher");

    if (orc) {
        encounter.push({ creatureId: orc.id, quantity: 3 });
        setStatBlock(renderCreatureBlock(orc));
    }
    if (goblin) {
        encounter.push({ creatureId: goblin.id, quantity: 2 });
    }
}

function applyUndeadPack() {
    ensureDefaultCreatures();
    encounter = [];

    let hound = creatures.find(c => c.id === "necrotic_hound");
    if (!hound) {
        hound = {
            id: "necrotic_hound",
            name: "Necrotic Hound",
            level: 3,
            role: "Skirmisher",
            hp: 40,
            ac: 15,
            speed: 8,
            abilities: "STR 14, DEX 16, CON 14, INT 3, WIS 12, CHA 6",
            traits: "Shadow Step: Can teleport up to 20 ft between dim light or darkness.",
            actions: "Bite +6 vs AC, 1d8+4 piercing + 1d6 necrotic.",
            notes: "Fast flanker; ideal for undead packs."
        };
        creatures.push(hound);
        updateCreatureSelect();
    }

    encounter.push({ creatureId: hound.id, quantity: 3 });
    setStatBlock(renderCreatureBlock(hound));
}

function applyEliteStrikeTeam() {
    ensureDefaultCreatures();
    encounter = [];

    const orc = creatures.find(c => c.id === "orc_brute");
    const hound = creatures.find(c => c.id === "necrotic_hound");

    if (orc) {
        encounter.push({ creatureId: orc.id, quantity: 2 });
        setStatBlock(renderCreatureBlock(orc));
    }
    if (hound) {
        encounter.push({ creatureId: hound.id, quantity: 2 });
    }
}

function applyBeastAmbush() {
    ensureDefaultCreatures();
    encounter = [];

    let beast = creatures.find(c => c.id === "apex_stalker_beast");
    if (!beast) {
        beast = {
            id: "apex_stalker_beast",
            name: "Stalker Beast",
            level: 4,
            role: "Skirmisher",
            hp: 55,
            ac: 16,
            speed: 8,
            abilities: "STR 16, DEX 16, CON 14, INT 4, WIS 12, CHA 6",
            traits: "Ambush Predator: Advantage on attack rolls against surprised creatures.",
            actions: "Rend +7 vs AC, 2d8+4 slashing.",
            notes: "Use in dense terrain; strike from concealment."
        };
        creatures.push(beast);
        updateCreatureSelect();
    }

    encounter.push({ creatureId: beast.id, quantity: 2 });
    setStatBlock(renderCreatureBlock(beast));
}

// ---------- Export ----------

function exportEncounter() {
    const partySize = getNumber("partySize", 4);
    const partyLevel = getNumber("partyLevel", 3);

    const payload = {
        party: {
            size: partySize,
            level: partyLevel
        },
        encounter: encounter.map(entry => {
            const creature = creatures.find(c => c.id === entry.creatureId);
            return {
                quantity: entry.quantity,
                creature: creature ? { ...creature } : { id: entry.creatureId }
            };
        })
    };

    const box = document.getElementById("exportBox");
    if (box) {
        box.value = JSON.stringify(payload, null, 2);
    }
}

function copyExport() {
    const box = document.getElementById("exportBox");
    if (!box || !box.value) {
        alert("Nothing to copy. Export the encounter first.");
        return;
    }
    box.select();
    box.setSelectionRange(0, box.value.length);
    document.execCommand("copy");
    alert("Export JSON copied to clipboard.");
}
