// ------------------------------------------------------------
// formation-logic.js — Formation target computation
// ------------------------------------------------------------

// Compute target positions for followers based on leader
// Writes targetX / targetY onto follower entities
export function applyFormations(simState, dt) {
    const entities = simState.entities;
    if (!entities || entities.length === 0) return;

    const leader = entities.find(e => e.role === "leader");
    if (!leader) return;

    const followers = entities.filter(e => e.role === "follower");

    // Simple V / wedge formation behind leader
    const spacing = 40;      // distance between ranks
    const lateral = 30;      // side offset

    followers.forEach((f, index) => {
        const rank = Math.floor(index / 2) + 1; // 1,1,2,2,3,3...
        const side = (index % 2 === 0) ? -1 : 1; // left/right

        const offsetX = side * lateral * rank;
        const offsetY = spacing * rank;

        f.targetX = leader.x + offsetX;
        f.targetY = leader.y + offsetY;
    });

    // Leader's target is just its current position (for now)
    leader.targetX = leader.x;
    leader.targetY = leader.y;
}
