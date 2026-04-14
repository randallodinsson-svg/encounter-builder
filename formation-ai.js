/*
    APEXCORE v4.4 — Formation AI
*/

(function () {
  const Entities = APEX.get("entities");
  const Formations = APEX.get("formations");

  const FormationAI = {
    mode: "idle",
    targetPattern: null,
    center: { x: 0, y: 0 },
    stiffness: 0.05,

    setMode(mode) {
      this.mode = mode;
      console.log(`APEXCORE v4.4 — Formation AI mode: ${mode}`);
    },

    applyPattern(name, options = {}) {
      const patternFn = Formations.get(name);
      if (!patternFn) return;
      const count = Entities.list.length || options.count || 64;
      const pattern = patternFn(count, options.radius || 200, options.spacing || 32);
      this.targetPattern = pattern;
      this.center.x = options.cx ?? window.innerWidth / 2;
      this.center.y = options.cy ?? window.innerHeight / 2;
    },

    onTick(delta) {
      if (!this.targetPattern) return;
      const ents = Entities.list;
      const pattern = this.targetPattern;
      const n = Math.min(ents.length, pattern.length);
      const dt = delta / 16.67;

      for (let i = 0; i < n; i++) {
        const e = ents[i];
        const p = pattern[i];
        const tx = this.center.x + p.x;
        const ty = this.center.y + p.y;
        e.x += (tx - e.x) * this.stiffness * dt;
        e.y += (ty - e.y) * this.stiffness * dt;
      }
    },
  };

  APEX.register("formation-ai", FormationAI);
})();
