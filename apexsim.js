// FILE: apexsim.js
/*
    APEXSIM v5.1 — Species Behavior Engine
    Updated for APEXCORE v4.4 lifecycle compatibility
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

    _species: [
      { id:0, name:"Alpha",   color:"#ffe9a3", maxSpeed:1.0, cohesion:1.0, alignment:1.0, separation:0.6, noise:0.2, fieldSensitivity:0.6, haloReaction:"stabilize" },
      { id:1, name:"Beta",    color:"#ff9f80", maxSpeed:1.6, cohesion:0.7, alignment:0.8, separation:0.4, noise:0.3, fieldSensitivity:0.4, haloReaction:"attract" },
      { id:2, name:"Gamma",   color:"#80c8ff", maxSpeed:1.1, cohesion:0.5, alignment:0.6, separation:1.2, noise:0.3, fieldSensitivity:0.7, haloReaction:"repel" },
      { id:3, name:"Delta",   color:"#b080ff", maxSpeed:1.3, cohesion:0.4, alignment:0.3, separation:0.5, noise:1.0, fieldSensitivity:0.5, haloReaction:"orbit" },
      { id:4, name:"Epsilon", color:"#7dffb3", maxSpeed:1.0, cohesion:0.8, alignment:0.7, separation:0.7, noise:0.4, fieldSensitivity:1.4, haloReaction:"strong" },
    ],

    _aggression: [
      [0,0,0,0,0],
      [0,0,2,1,2],
      [0,0,0,0,0],
      [0,1,0,0,0],
      [0,0,0,0,0],
    ],

    _initialized: false,

    init() {
      if (this._initialized) return;
      this._initialized = true;
      this._rebuildParticles();
    },

    start() {
      console.log("APEXCORE v5.1 — APEXSIM online.");
      this._rebuildParticles();
    },

    update(dt) {
      if (this._state.paused) return;
      this._state.time += dt;
    },

    setPreset(name) { this._state.preset = name || "drift"; },
    setParticleCount(count) { this._state.particleCount = Math.max(16, Math.min(5000, count|0)); this._rebuildParticles(); },
    setSpeed(speed) { this._state.particleSpeed = Math.max(0.05, Math.min(5, speed)); },
    setFieldStrength(strength) { this._state.fieldStrength = Math.max(0, Math.min(5, strength)); },
    enableObstacles(e) { this._state.obstaclesEnabled = !!e; },
    enableTrails(e) { this._state.trailsEnabled = !!e; },
    pause() { this._state.paused = true; },
    resume() { this._state.paused = false; },

    spawnBurst(n) {
      const count = n || 64;
      const w = window.innerWidth, h = window.innerHeight;
      const cx = w*0.5, cy = h*0.5;
      for (let i=0;i<count;i++){
        const a = Math.random()*TWO_PI;
        const r = 40+Math.random()*80;
        const x = cx+Math.cos(a)*r;
        const y = cy+Math.sin(a)*r;
        const speciesId = i % this._species.length;
        this._state.particles.push(this._makeParticle(x,y,speciesId));
      }
    },

    reset() { this._rebuildParticles(); },

    sampleFlow(x, y, index) {
      const s = this._state;
      const p = s.particles[index];
      if (!p) return { fx:0, fy:0 };

      const species = this._species[p.speciesId];

      const neighborRadius = 80;
      const separationRadius = 24;

      let count=0, avgX=0, avgY=0, avgVX=0, avgVY=0, sepX=0, sepY=0;
      let fleeX=0, fleeY=0, chaseX=0, chaseY=0;

      const particles = s.particles;

      for (let i=0;i<particles.length;i++){
        if (i===index) continue;
        const o = particles[i];

        const dx=o.x-x, dy=o.y-y;
        const distSq = dx*dx+dy*dy;
        if (distSq > neighborRadius*neighborRadius) continue;

        const dist = Math.sqrt(distSq)||0.0001;
        const nx = dx/dist, ny = dy/dist;

        avgX+=o.x; avgY+=o.y;
        avgVX+=o.vx; avgVY+=o.vy;
        count++;

        if (dist < separationRadius){
          sepX -= nx/dist;
          sepY -= ny/dist;
        }

        const myS = p.speciesId;
        const otherS = o.speciesId;

        const ag = this._aggression[myS][otherS]||0;
        const rag = this._aggression[otherS][myS]||0;

        if (ag>0){
          const k = ag===2 ? 1.0 : 0.5;
          chaseX += dx*k/dist;
          chaseY += dy*k/dist;
        }

        if (rag>0){
          const k = rag===2 ? 1.2 : 0.7;
          fleeX -= dx*k/dist;
          fleeY -= dy*k/dist;
        }
      }

      let cohX=0, cohY=0, aliX=0, aliY=0;
      if (count>0){
        const inv=1/count;
        const cx=avgX*inv, cy=avgY*inv;
        cohX = cx-x; cohY = cy-y;
        aliX = (avgVX*inv)-p.vx;
        aliY = (avgVY*inv)-p.vy;
      }

      const base = this._sampleBaseField(x,y,p.speciesId);

      const noiseAngle = this._hash2(x*0.007, y*0.007)*TWO_PI;
      const noiseX = Math.cos(noiseAngle);
      const noiseY = Math.sin(noiseAngle);

      let haloFX=0, haloFY=0;
      if (window.HALO_FIELD){
        const hf = window.HALO_FIELD.sample(x,y,p.speciesId);
        switch (species.haloReaction){
          case "attract":   haloFX+=hf.fx*1.4; haloFY+=hf.fy*1.4; break;
          case "repel":     haloFX-=hf.fx*1.2; haloFY-=hf.fy*1.2; break;
          case "orbit":     haloFX+=-hf.fy*1.0; haloFY+=hf.fx*1.0; break;
          case "strong":    haloFX+=hf.fx*1.8; haloFY+=hf.fy*1.8; break;
          default:          haloFX+=hf.fx*0.6; haloFY+=hf.fy*0.6; break;
        }
      }

      let envFX=0, envFY=0;
      if (window.ENV_FIELD){
        const env = window.ENV_FIELD.sample(x,y);
        envFX = env.fx * species.fieldSensitivity;
        envFY = env.fy * species.fieldSensitivity;
      }

      let fx=0, fy=0;

      fx += cohX*species.cohesion*0.002;
      fy += cohY*species.cohesion*0.002;

      fx += aliX*species.alignment*0.02;
      fy += aliY*species.alignment*0.02;

      fx += sepX*species.separation*0.08;
      fy += sepY*species.separation*0.08;

      fx += fleeX*0.12;
      fy += fleeY*0.12;

      fx += chaseX*0.06;
      fy += chaseY*0.06;

      fx += base.fx * species.fieldSensitivity * s.fieldStrength;
      fy += base.fy * species.fieldSensitivity * s.fieldStrength;

      fx += noiseX * species.noise * 0.15;
      fy += noiseY * species.noise * 0.15;

      fx += haloFX;
      fy += haloFY;

      fx += envFX;
      fy += envFY;

      return { fx, fy };
    },

    _rebuildParticles() {
      const s=this._state;
      s.particles.length=0;
      const w=window.innerWidth, h=window.innerHeight;
      for (let i=0;i<s.particleCount;i++){
        const x=Math.random()*w, y=Math.random()*h;
        const speciesId=i%this._species.length;
        s.particles.push(this._makeParticle(x,y,speciesId));
      }
    },

    _makeParticle(x,y,speciesId){
      const sp=this._species[speciesId];
      const a=Math.random()*TWO_PI;
      const speed=0.2+Math.random()*sp.maxSpeed;
      return { x,y, vx:Math.cos(a)*speed, vy:Math.sin(a)*speed, speciesId };
    },

    _sampleBaseField(x,y,speciesId){
      const preset=this._state.preset;
      const w=window.innerWidth, h=window.innerHeight;
      const nx=(x/w)-0.5, ny=(y/h)-0.5;

      if (preset==="orbit"){
        const r=Math.sqrt(nx*nx+ny*ny)+0.0001;
        return { fx:-ny/r*0.8, fy:nx/r*0.8 };
      }

      if (preset==="pulse"){
        const r=Math.sqrt(nx*nx+ny*ny)+0.0001;
        const s=Math.sin(r*18 - this._state.time*0.02);
        return { fx:nx*s*1.2, fy:ny*s*1.2 };
      }

      if (preset==="swarm"){
        const a=this._hash2(nx*8, ny*8+speciesId*13.37)*TWO_PI;
        return { fx:Math.cos(a), fy:Math.sin(a) };
      }

      const a=this._hash2(nx*4+10.3, ny*4-7.1)*TWO_PI;
      return { fx:Math.cos(a)*0.6, fy:Math.sin(a)*0.6 };
    },

    _hash2(x,y){
      const s=Math.sin(x*127.1 + y*311.7)*43758.5453;
      return s-Math.floor(s);
    },
  };

  window.APEXSIM = SIM;
  APEX.register("apexsim", SIM);

})();
