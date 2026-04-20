// ------------------------------------------------------------
// apexsim.js — APEXSIM Core
// ------------------------------------------------------------

const sim = {
    time: 0,
    entities: [],
    enemies: [],
    formation: {
        leaderId: null,
        ghosts: []
    },
    cameraAnchors: {
        leader: { x: 0, y: 0 }
    }
};

export function getSimState(){
    return sim;
}

export function initSim(){
    console.log("APEXSIM - Core initializing");

    sim.entities = [
        { id: 1, x: 0,   y: 0,   facing: 0 },
        { id: 2, x: 40,  y: 0,   facing: 0 },
        { id: 3, x: -40, y: 0,   facing: 0 },
        { id: 4, x: 0,   y: 40,  facing: 0 }
    ];

    sim.formation.leaderId = 1;

    sim.formation.ghosts = [
        { x: 0,   y: -40 },
        { x: 40,  y: -40 },
        { x: -40, y: -40 },
        { x: 0,   y: -80 }
    ];

    updateCameraAnchors();

    console.log("APEXSIM - Core online");
}

function updateCameraAnchors(){
    const leader = sim.entities.find(e => e.id === sim.formation.leaderId);
    if(!leader) return;
    sim.cameraAnchors.leader.x = leader.x;
    sim.cameraAnchors.leader.y = leader.y;
}

export function updateSim(dt){
    sim.time += dt;
    updateCameraAnchors();
}
