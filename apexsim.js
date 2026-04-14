/*
    APEXSIM v4.9 — Species Behavior Engine
    5 Species, Strong Differences, Fast Predators
    Compatible with:
      - apexsim-renderer.js (sampleFlow API)
      - apex-ui.js (SIM control API)
*/

(function () {

  const TWO_PI = Math.PI * 2;

  const SIM = {
    _state: {
      particles: [],
      particleCount: 512,
      particleSpeed: 1.0,
      fieldStrength: 1.0,
      trailsEnabled: true,
      obstaclesEnabled: true,
      paused: false,
      preset: "drift",
      time: 0,
    },

    // 5 species with strong differences
    _species: [
      {
        id: 0,
        name: "Alpha",
        color: "#ffe9a3",
        maxSpeed: 1.0,
        cohesion: 1.0,
        alignment: 1.0,
        separation: 0.6,
        noise: 0.2,
        fieldSensitivity: 0.6,
      },
      {
        id: 1,
        name: "Beta",
        color: "#ff9f80",
        maxSpeed: 1.6,      // fast predators
        cohesion: 0.7,
        alignment: 0.8,
        separation: 0.4,
        noise: 0.3,
        fieldSensitivity: 0.4,
      },
      {
        id: 2,
        name: "Gamma",
        color: "#80c8ff",
        maxSpeed: 1.1,
        cohesion: 0.5,
        alignment: 0.6,
        separation: 1.2,    // strong avoidance
        noise: 0.3,
        fieldSensitivity: 0.7,
      },
      {
        id: 3,
        name: "Delta",
        color: "#b080ff",
        maxSpeed: 1.3,
        cohesion: 0.4,
        alignment: 0.3,
        separation: 0.5,
        noise: 1.0,         // chaotic
        fieldSensitivity: 0.5,
      },
      {
        id: 4,
        name: "Epsilon",
        color: "#7dffb3",
        maxSpeed: 1.0,
        cohesion: 0.8,
        alignment: 0.7,
        separation: 0.7,
        noise: 0.4,
        fieldSensitivity: 1.2, // very sensitive to fields
      },
    ],

    // aggression matrix: who hunts who (predator → prey)
    // values: 0 = ignore, 1 = mild, 2 = strong
    _aggression: [
      //  A   B   G   D   E
      [ 0,  0,  0,  0,  0 ], // Alpha
      [ 0,  0,  2,  1,  2 ], // Beta (predator)
      [ 0,  0,  0,  0,  0 ], // Gamma
      [ 0,  1,  0,  0,  0 ], // Delta (harasses Betas a bit)
      [ 0,  0,  0,  0,  0 ], // Epsilon
    ],

    start() {
      console.log("APEXCORE v4.9 — APEXSIM online.");

      this._state.preset = "drift";
      this._rebuildParticles();
    },

    /* -------------------------------------------------- */
    /*                 PUBLIC CONTROL API                 */
    /* -------------------------------------------------- */

    setPreset(name) {
      this._state.preset = name || "drift";
    },

    setParticleCount(count) {
      this._state.particleCount = Math.max(16, Math.min(5000, count | 0));
      this._rebuildParticles();
    },

    setSpeed(speed) {
      this._state.particleSpeed = Math.max(0.05, Math.min(5, speed));
    },

    setFieldStrength(strength) {
      this._state.fieldStrength = Math.max(0, Math.min(5, strength));
    },

    enableObstacles(enabled) {
      this._state.obstaclesEnabled = !!enabled;
    },

    enableTrails(enabled) {
      this._state.trailsEnabled = !!enabled;
    },

    pause() {
      this._state.paused = true;
    },

    resume() {
      this._state.paused = false;
    },

    spawnBurst(count) {
      const n = count || 64;
      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      const cx = w * 0.5;
      const cy = h * 0.5;

      for (let i = 0; i < n; i++) {
        const angle = Math.random() * TWO_PI;
        const radius = 40 + Math.random() * 80;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const speciesId = (i % this._species.length);
        this._state.particles.push(this._makeParticle(x, y, speciesId));
      }
    },

    reset() {
      this._rebuildParticles();
    },

    /* -------------------------------------------------- */
    /*              CORE FIELD / FLOW FUNCTION            */
    /* -------------------------------------------------- */

    /**
     * Called by apexsim-renderer.js for each particle per frame.
     * Returns a flow vector { fx, fy }.
     */
    sampleFlow(x, y, index) {
      const s = this._state;
      const particles = s.particles;
      const p = particles[index];
      if (!p) {
        return { fx: 0, fy: 0 };
      }

      const species = this._species[p.speciesId] || this._species[0];

      // Neighborhood parameters
      const neighborRadius = 80;
      const separationRadius = 24;

      let count = 0;
      let avgX = 0;
      let avgY = 0;
      let avgVX = 0;
      let avgVY = 0;
      let sepX = 0;
      let sepY = 0;

      // Predator / prey forces
      let fleeX = 0;
      let fleeY = 0;
      let chaseX = 0;
      let chaseY = 0;

      for (let i = 0; i < particles.length; i++) {
        if (i === index) continue;
        const o = particles[i];

        const dx = o.x - x;
        const dy = o.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq > neighborRadius * neighborRadius) continue;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;

        // Flocking accumulation
        avgX += o.x;
        avgY += o.y;
        avgVX += o.vx;
        avgVY += o.vy;
        count++;

        // Separation
        if (dist < separationRadius) {
          sepX -= nx / dist;
          sepY -= ny / dist;
        }

        // Species interaction
        const mySpecies = p.speciesId;
        const otherSpecies = o.speciesId;

        const aggression = this._aggression[mySpecies][otherSpecies] || 0;
        const reverseAggression = this._aggression[otherSpecies][mySpecies] || 0;

        // If this species hunts the other → chase
        if (aggression > 0) {
          const strength = aggression === 2 ? 1.0 : 0.5;
          chaseX += dx * strength / dist;
          chaseY += dy * strength / dist;
        }

        // If the other species hunts this → flee
        if (reverseAggression > 0) {
          const strength = reverseAggression === 2 ? 1.2 : 0.7;
          fleeX -= dx * strength / dist;
          fleeY -= dy * strength / dist;
        }
      }

      let cohX = 0, cohY = 0;
      let aliX = 0, aliY = 0;

      if (count > 0) {
        const inv = 1 / count;

        const centerX = avgX * inv;
        const centerY = avgY * inv;

        cohX = (centerX - x);
        cohY = (centerY - y);

        aliX = (avgVX * inv) - p.vx;
        aliY = (avgVY * inv) - p.vy;
      }

      // Base flow field (preset‑driven)
      const base = this._sampleBaseField(x, y, p.speciesId);

      // Noise
      const noiseAngle = this._hash2(x * 0.007, y * 0.007) * TWO_PI;
      const noiseX = Math.cos(noiseAngle);
      const noiseY = Math.sin(noiseAngle);

      // Combine forces
      let fx = 0;
      let fy = 0;

      fx += cohX * species.cohesion * 0.002;
      fy += cohY * species.cohesion * 0.002;

      fx += aliX * species.alignment * 0.02;
      fy += aliY * species.alignment * 0.02;

      fx += sepX * species.separation * 0.08;
      fy += sepY * species.separation * 0.08;

      fx += fleeX * 0.12;
      fy += fleeY * 0.12;

      fx += chaseX * 0.06;
      fy += chaseY * 0.06;

      fx += base.fx * species.fieldSensitivity * this._state.fieldStrength;
      fy += base.fy * species.fieldSensitivity * this._state.fieldStrength;

      fx += noiseX * species.noise * 0.15;
      fy += noiseY * species.noise * 0.15;

      return { fx, fy };
    },

    /* -------------------------------------------------- */
    /*                 INTERNAL UTILITIES                 */
    /* -------------------------------------------------- */

    _rebuildParticles() {
      const s = this._state;
      s.particles.length = 0;

      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;

      for (let i = 0; i < s.particleCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const speciesId = i % this._species.length;
        s.particles.push(this._makeParticle(x, y, speciesId));
      }
    },

    _makeParticle(x, y, speciesId) {
      const sp = this._species[speciesId] || this._species[0];

      const angle = Math.random() * TWO_PI;
      const speed = 0.2 + Math.random() * sp.maxSpeed;

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speciesId,
      };
    },

    _sampleBaseField(x, y, speciesId) {
      const preset = this._state.preset;

      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      const nx = (x / w) - 0.5;
      const ny = (y / h) - 0.5;

      if (preset === "orbit") {
        const r = Math.sqrt(nx * nx + ny * ny) + 0.0001;
        const tx = -ny / r;
        const ty = nx / r;
        return { fx: tx * 0.8, fy: ty * 0.8 };
      }

      if (preset === "pulse") {
        const r = Math.sqrt(nx * nx + ny * ny) + 0.0001;
        const scale = Math.sin(r * 18 - this._state.time * 0.02);
        return { fx: nx * scale * 1.2, fy: ny * scale * 1.2 };
      }

      if (preset === "swarm") {
        const angle = this._hash2(nx * 8, ny * 8 + speciesId * 13.37) * TWO_PI;
        return { fx: Math.cos(angle), fy: Math.sin(angle) };
      }

      // default: drift
      const angle = this._hash2(nx * 4 + 10.3, ny * 4 - 7.1) * TWO_PI;
      return { fx: Math.cos(angle) * 0.6, fy: Math.sin(angle) * 0.6 };
    },

    _hash2(x, y) {
      // simple 2D hash → [0,1)
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    },
  };

  window.APEXSIM = SIM;
  APEX.register("apexsim", SIM);

})();
