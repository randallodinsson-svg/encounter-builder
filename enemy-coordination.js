// ------------------------------------------------------------
// enemy-coordination.js — APEXSIM v8.4 Hybrid Coordination AI
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

const PACK_RADIUS       = 160;
const DESIRED_SPACING   = 40;
const SURROUND_DISTANCE = 220;
const SURROUND_SPEED    = 60;
const SEPARATION_FORCE  = 80;

// ------------------------------------------------------------
// UTILS
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
export function updateEnemyCoordination(dt){
    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    const enemies = sim.enemies;
    if(!enemies || enemies.length === 0) return;

    // Read leader order (if any)
    let leaderOrderType = null;
    if(leader.order && leader.order.type){
        leaderOrderType = leader.order.type;
    }

    // For each enemy, compute local pack and apply hybrid steering
    for(const en of enemies){
        // Build local pack
        const pack = [];
        for(const other of enemies){
            if(other === en) continue;
            if(dist(en, other) < PACK_RADIUS){
                pack.push(other);
            }
        }

        const packSize = pack.length + 1;

        // Compute pack center
        let cx = en.x;
        let cy = en.y;
        for(const p of pack){
            cx += p.x;
            cy += p.y;
        }
        cx /= packSize;
        cy /= packSize;

        const dToLeader = dist(en, leader);

        // --------------------------------------------------------
        // 1) SEPARATION — avoid clumping
        // --------------------------------------------------------
        let sepX = 0;
        let sepY = 0;
        for(const p of pack){
            const d = dist(en, p);
            if(d < DESIRED_SPACING && d > 0.001){
                const dx = en.x - p.x;
                const dy = en.y - p.y;
                const f  = (DESIRED_SPACING - d) / DESIRED_SPACING;
                sepX += (dx / d) * f;
                sepY += (dy / d) * f;
            }
        }
        en.x += sepX * SEPARATION_FORCE * dt;
        en.y += sepY * SEPARATION_FORCE * dt;

        // --------------------------------------------------------
        // 2) HYBRID PACK LOGIC
        // --------------------------------------------------------
        // Base angle to leader
        const baseAng = angleTo(en, leader);

        // Surround behavior when close and pack is big
        if(dToLeader < SURROUND_DISTANCE && packSize >= 3){
            // Tangential motion around leader
            const side = (en.x < leader.x) ? 1 : -1;
            const tangential = baseAng + side * Math.PI * 0.5;

            en.x += Math.cos(tangential) * SURROUND_SPEED * dt;
            en.y += Math.sin(tangential) * SURROUND_SPEED * dt;
            en.facing = baseAng;
            continue;
        }

        // Leader ATTACK / MOVE → enemies favor flanking arcs
        if((leaderOrderType === "attack" || leaderOrderType === "move") && dToLeader >= SURROUND_DISTANCE){
            const flankOffset = (en.x < leader.x) ? 0.9 : -0.9;
            const flankAng = baseAng + flankOffset;
            en.facing = flankAng;
            en.x += Math.cos(flankAng) * 40 * dt;
            en.y += Math.sin(flankAng) * 40 * dt;
            continue;
        }

        // Leader FLEE → packs press more directly
        if(leaderOrderType === "flee"){
            const pressAng = baseAng;
            en.facing = pressAng;
            en.x += Math.cos(pressAng) * 50 * dt;
            en.y += Math.sin(pressAng) * 50 * dt;
            continue;
        }

        // Leader HOLD / REGROUP → enemies probe cautiously (stay near pack center)
        if(leaderOrderType === "hold" || leaderOrderType === "regroup"){
            const dx = cx - en.x;
            const dy = cy - en.y;
            const d  = Math.hypot(dx, dy);
            if(d > DESIRED_SPACING * 1.5){
                const step = 30 * dt;
                const t = step >= d ? 1 : step / d;
                en.x += dx * t;
                en.y += dy * t;
                en.facing = Math.atan2(dy, dx);
            }
        }
    }
}
