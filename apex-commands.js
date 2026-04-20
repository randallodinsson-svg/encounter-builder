// ------------------------------------------------------------
// apex-commands.js — Modern Tactical Command Layer
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// Issue a command to the formation
// ------------------------------------------------------------
export function issueCommand(type, data = {}) {
    const sim = getSimState();
    const entities = sim.entities;

    const leader = entities.find(e => e.role === "leader");
    if (!leader) {
        console.warn("No leader found — cannot issue command.");
        return;
    }

    switch (type) {
        case "move":
            applyMoveCommand(leader, entities, data);
            break;

        case "set-formation":
            applyFormationCommand(leader, entities, data);
            break;

        case "target":
            applyTargetCommand(leader, entities, data);
            break;

        default:
            console.warn("Unknown command:", type);
    }
}

// ------------------------------------------------------------
// MOVE COMMAND — Move entire formation to a point
// ------------------------------------------------------------
function applyMoveCommand(leader, entities, data) {
    const { x, y } = data;
    if (x === undefined || y === undefined) return;

    leader.targetX = x;
    leader.targetY = y;

    // Followers will automatically reposition via formation logic
}

// ------------------------------------------------------------
// FORMATION COMMAND — Change formation type
// ------------------------------------------------------------
function applyFormationCommand(leader, entities, data) {
    const { formation } = data;
    const sim = getSimState();

    sim.currentFormation = formation || "wedge";
}

// ------------------------------------------------------------
// TARGET COMMAND — Assign a target entity
// ------------------------------------------------------------
function applyTargetCommand(leader, entities, data) {
    const { targetId } = data;
    const target = entities.find(e => e.id === targetId);

    if (!target) return;

    leader.targetEntity = target;
}
