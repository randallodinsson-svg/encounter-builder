// ------------------------------------------------------------
// apexsim.js — APEXSIM Core (Entities, Enemies, Formation)
// ------------------------------------------------------------

// ------------------------------------------------------------
// SIMULATION STATE
// ------------------------------------------------------------
const sim = {
    time: 0,

    entities: [],     // player squad
    enemies: [],      // spawned enemies

    formation: {
        leaderId: null,
        ghosts: []
    },

    cameraAnchors: {
        leader: { x: 0, y: 0 }
    }
};

// ------------------------------------------------------------
// EXPORT: GET SIM STATE
// ------------------------------------------------------------
export function getSimState(){
    return sim;
}

// ------------------------------------------------------------
// INIT SIMULATION
// ------------------------------------------------------------
export function initSim(){

    console.log("APEXSIM - Core initializing");

    // Create a default squad of 4 units
    sim.entities = [
        { id: 1, x: 0,   y: 0,   facing: 0 },
        { id: 2, x: 40,  y: 0,   facing: 0 },
        { id: 3, x: -40, y: 0,   facing: 0 },
        { id: 4, x: 0,   y: 40,  facing: 0 }
    ];

    // Default leader
    sim.formation.leaderId = 1;

    // Formation ghosts (visual placeholders)
    sim.formation.ghosts = [
        { x: 0,   y: -40 },
        { x: 40,  y: -40 },
        { x: -40, y: -40 },
        { x: 0,   y: -80 }
    ];

    // Camera anchor follows leader
    updateCameraAnchors();

    console.log("APEXSIM - Core online");
}

// ------------------------------------------------------------
// UPDATE CAMERA ANCHORS
// ------------------------------------------------------------
function updateCameraAnchors(){
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;

    sim.cameraAnchors.leader.x = leader.x;
    sim.cameraAnchors.leader.y = leader.y;
}

// ------------------------------------------------------------
// SIM UPDATE (CALLED BY RENDERER)
// ------------------------------------------------------------
export function updateSim(dt){
    sim.time += dt;

    // Update camera anchor every frame
    updateCameraAnchors();
}
