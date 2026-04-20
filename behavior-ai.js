// ------------------------------------------------------------
// behavior-ai.js — APEXSIM v8.2 Behavior AI
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

// ------------------------------------------------------------
// PARAMETERS
// ------------------------------------------------------------
const DETECTION_RADIUS = 260;
const ATTACK_RADIUS = 120;
const FLEE_RADIUS = 80;

// ------------------------------------------------------------
// BEHAVIOR TYPES
// ------------------------------------------------------------
const AI = {
    IDLE: "idle",
    AGGRO: "aggro",
    FLANK: "flank",
    RETREAT: "retreat"
};

// ------------------------------------------------------------
// UTILITY
// ------------------------------------------------------------
function dist(a, b){
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

function angleTo(a, b){
    return Math.atan2(b.y - a.y, b.x - a.x);
}

// ------------------------------------------------------------
// MAIN UPDATE
// ------------------------------------------------------------
export function updateBehaviorAI(dt){
    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    for(const en of sim.enemies){

        // Assign default behavior if missing
        if(!en.behavior) en.behavior = AI.IDLE;

        const d = dist(en, leader);

        // -----------------------------
        // BEHAVIOR SELECTION
        // -----------------------------
        if(d < FLEE_RADIUS){
            en.behavior = AI.RETREAT;
        }
        else if(d < ATTACK_RADIUS){
            en.behavior = AI.AGGRO;
        }
        else if(d < DETECTION_RADIUS){
            en.behavior = AI.FLANK;
        }
        else{
            en.behavior = AI.IDLE;
        }

        // -----------------------------
        // BEHAVIOR EXECUTION
        // -----------------------------
        switch(en.behavior){

            case AI.IDLE:
                // Minimal drift
                en.facing += (Math.random() - 0.5) * 0.4 * dt;
                break;

            case AI.AGGRO:
                {
                    const ang = angleTo(en, leader);
                    en.facing = ang;
                    en.x += Math.cos(ang) * 90 * dt;
                    en.y += Math.sin(ang) * 90 * dt;
                }
                break;

            case AI.FLANK:
                {
                    const ang = angleTo(en, leader);
                    const flank = ang + (Math.random() > 0.5 ? 1.2 : -1.2);
                    en.facing = flank;
                    en.x += Math.cos(flank) * 70 * dt;
                    en.y += Math.sin(flank) * 70 * dt;
                }
                break;

            case AI.RETREAT:
                {
                    const ang = angleTo(leader, en); // reverse
                    en.facing = ang;
                    en.x += Math.cos(ang) * 140 * dt;
                    en.y += Math.sin(ang) * 140 * dt;
                }
                break;
        }
    }
}
