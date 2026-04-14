/*
    APEXCORE v4.4 — Overlay System (Root‑Safe Edition)
*/

(function () {
  const Overlay = {
    root: null,

    start() {
      // Updated root selector to match your index.html
      this.root = document.getElementById("apex-root");

      if (!this.root) {
        console.warn("Overlay v4.4 — Root #apex-root not found. Overlay disabled.");
        return;
      }

      console.log("Overlay v4.4 — Online.");
      // Optional: add overlay layers here later
    },
  };

  APEX.register("overlay", Overlay);
})();
