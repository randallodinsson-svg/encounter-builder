/*
    APEXCORE v4.4 — Formation Library
*/

(function () {
  const Formations = {
    patterns: {
      line(count, width) {
        const out = [];
        for (let i = 0; i < count; i++) {
          const t = count === 1 ? 0.5 : i / (count - 1);
          out.push({ x: (t - 0.5) * width, y: 0 });
        }
        return out;
      },
      circle(count, radius) {
        const out = [];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          out.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius });
        }
        return out;
      },
      grid(cols, rows, spacing) {
        const out = [];
        const w = (cols - 1) * spacing;
        const h = (rows - 1) * spacing;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            out.push({
              x: x * spacing - w / 2,
              y: y * spacing - h / 2,
            });
          }
        }
        return out;
      },
    },
    get(name) {
      return this.patterns[name] || null;
    },
  };

  APEX.register("formations", Formations);
})();
