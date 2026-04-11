export const APEXAI = {

    generateScenario() {
        return {
            id: crypto.randomUUID(),
            title: "Generated Scenario",
            difficulty: "Medium",
            environment: "Forest",
            enemies: [
                { type: "Goblin", count: 3 },
                { type: "Wolf", count: 1 }
            ],
            rewards: {
                xp: 120,
                loot: ["Herbs", "Wolf Pelt"]
            },
            timestamp: Date.now()
        };
    },

    evaluateScenario() {
        return {
            score: 78,
            dangerLevel: "Moderate",
            recommendedPartyLevel: 3,
            notes: "Encounter is balanced for a small party."
        };
    }

};
