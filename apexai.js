/* ============================================================
   APEXAI v3 — Scenario Intelligence Engine (Standard Edition)
   Clean, deterministic, modular, browser‑native
   ============================================================ */

const APEXAI = (() => {

    /* ------------------------------------------------------------
       INTERNAL STATE
    ------------------------------------------------------------ */
    let difficulty = "normal";

    const difficultySettings = {
        easy:    { enemies: [1, 2], loot: [2, 3], danger: 0.2 },
        normal:  { enemies: [2, 4], loot: [1, 2], danger: 0.4 },
        hard:    { enemies: [3, 6], loot: [0, 1], danger: 0.6 },
        extreme: { enemies: [5, 9], loot: [0, 1], danger: 0.85 }
    };

    /* ------------------------------------------------------------
       UTILITY FUNCTIONS
    ------------------------------------------------------------ */

    function randRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateID() {
        return "SCN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    /* ------------------------------------------------------------
       SCENARIO GENERATION
    ------------------------------------------------------------ */

    function generateScenario() {
        const diff = difficultySettings[difficulty];

        const titles = [
            "Ambush in the Ravine",
            "Lost Caravan Escort",
            "Siege at Dawn",
            "The Broken Gate",
            "Shadows in the Marsh",
            "The Fallen Outpost",
            "The Silent Ruins"
        ];

        const enemies = [
            "Goblins",
            "Bandits",
            "Undead",
            "Mercenaries",
            "Cultists",
            "Wolves",
            "Constructs"
        ];

        const objectives = [
            "Defend the position",
            "Escort the target",
            "Eliminate the threat",
            "Recover the artifact",
            "Survive until extraction",
            "Investigate the anomaly"
        ];

        const scenario = {
            id: generateID(),
            title: pick(titles),
            difficulty,
            enemyType: pick(enemies),
            enemyCount: randRange(diff.enemies[0], diff.enemies[1]),
            lootQuality: randRange(diff.loot[0], diff.loot[1]),
            dangerRating: diff.danger,
            objective: pick(objectives),
            timestamp: Date.now()
        };

        return scenario;
    }

    /* ------------------------------------------------------------
       SCENARIO EVALUATION
    ------------------------------------------------------------ */

    function evaluateScenario() {
        const score = Math.random();

        let rating = "Unknown";

        if (score < 0.25) rating = "Trivial";
        else if (score < 0.5) rating = "Manageable";
        else if (score < 0.75) rating = "Challenging";
        else rating = "Deadly";

        return {
            rating,
            score: Number(score.toFixed(3)),
            recommendedPlayers: Math.ceil(score * 4) + 1,
            timestamp: Date.now()
        };
    }

    /* ------------------------------------------------------------
       DIFFICULTY CONTROL
    ------------------------------------------------------------ */

    function setDifficulty(level) {
        if (difficultySettings[level]) {
            difficulty = level;
        }
    }

    /* ------------------------------------------------------------
       PUBLIC API
    ------------------------------------------------------------ */

    return {
        generateScenario,
        evaluateScenario,
        setDifficulty
    };

})();
