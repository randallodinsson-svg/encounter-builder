// ------------------------------------------------------------
// formation-followers.js — APEXSIM v8.3 Formation Followers
// ------------------------------------------------------------

import { getSimState } from "./apexsim.js";

const FOLLOW_SPEED = 110;
const SNAP_DISTANCE = 6;

// ------------------------------------------------------------
// UPDATE FORMATION FOLLOWERS
// ------------------------------------------------------------
export function updateFormationFollowers(dt){
    const sim = getSimState();
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    // Build a stable list of followers (everyone except leader)
    const followers = sim.entities.filter(e => e.id !== sim.formation.leaderId);

    // Use formation ghosts as relative offsets
    const ghosts = sim.formation.ghosts;
    if(!ghosts || ghosts.length === 0) return;

    for(let i = 0; i < followers.length; i++){
        const f = followers[i];
        const g = ghosts[i % ghosts.length];

        // Desired world position = leader position + ghost offset
        const targetX = leader.x + g.x;
        const targetY = leader.y + g.y;

        const dx = targetX - f.x;
        const dy = targetY - f.y;
        const d  = Math.hypot(dx, dy);

        if(d < SNAP_DISTANCE){
            // Close enough — snap and align facing
            f.x = targetX;
            f.y = targetY;
            continue;
        }

        const step = FOLLOW_SPEED * dt;
        const t = step >= d ? 1 : step / d;

        f.x += dx * t;
        f.y += dy * t;

        f.facing = Math.atan2(dy, dx);
    }
}
