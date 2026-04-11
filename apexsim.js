// APEXSIM v4 — Minimal Deterministic Simulation Engine
// Clean, stable, and UI‑agnostic.

export const APEXSIM = {

    version: "4.0.0",

    state: {
        tick: 0,
        entities: [],
        energy: 100,
        events: []
    },

    // Initialize simulation
    init() {
        this.state.tick = 0;
        this.state.energy = 100;
        this.state.entities = [
            { id: "ent-1", type: "Unit", hp: 10 },
            { id: "ent-2", type: "Unit", hp: 12 }
        ];
        this.state.events = [];

        return {
            status: "OK",
            message: "Simulation initialized.",
            state: structuredClone(this.state),
            timestamp: Date.now()
        };
    },

    // Run one simulation tick
    tick() {
        this.state.tick++;
        this.state.energy = Math.max(0, this.state.energy - 1);

        const event = {
            id: crypto.randomUUID(),
            type: "heartbeat",
            tick: this.state.tick,
            timestamp: Date.now()
        };

        this.state.events.push(event);

        return {
            id: crypto.randomUUID(),
            tick: this.state.tick,
            energy: this.state.energy,
            entities: structuredClone(this.state.entities),
            events: [event],
            timestamp: Date.now()
        };
    },

    // Reset simulation
    reset() {
        this.state.tick = 0;
        this.state.energy = 100;
        this.state.entities = [];
        this.state.events = [];

        return {
            status: "OK",
            message: "Simulation reset.",
            timestamp: Date.now()
        };
    }
};
