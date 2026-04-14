/*
    APEXCORE v4.4 — Debug Console
    Hotkey: ` (tilde) to toggle
*/

(function () {
  const DebugConsole = {
    visible: false,
    root: null,
    logEl: null,
    inputEl: null,

    start() {
      console.log("APEXCORE v4.4 — Debug Console armed (press ` to toggle).");
      this.createUI();
      this.bindHotkey();
    },

    createUI() {
      // Root container
      this.root = document.createElement("div");
      this.root.id = "apex-debug-console";
      Object.assign(this.root.style, {
        position: "fixed",
        left: "16px",
        bottom: "16px",
        width: "420px",
        maxHeight: "260px",
        background: "rgba(0,0,0,0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "6px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: "11px",
        color: "#e0e0e0",
        display: "none",
        flexDirection: "column",
        zIndex: 9999,
        boxShadow: "0 0 24px rgba(0,0,0,0.7)",
      });

      // Header
      const header = document.createElement("div");
      header.textContent = "APEXCORE DEBUG CONSOLE";
      Object.assign(header.style, {
        padding: "6px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        letterSpacing: "0.08em",
        fontSize: "10px",
        color: "#ffcc66",
      });

      // Log area
      this.logEl = document.createElement("div");
      this.logEl.id = "apex-debug-log";
      Object.assign(this.logEl.style, {
        padding: "6px 8px",
        overflowY: "auto",
        flex: "1 1 auto",
        whiteSpace: "pre-wrap",
      });

      // Input row
      const inputRow = document.createElement("div");
      Object.assign(inputRow.style, {
        borderTop: "1px solid rgba(255,255,255,0.12)",
        padding: "4px 6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      });

      const prompt = document.createElement("span");
      prompt.textContent = ">";
      Object.assign(prompt.style, {
        color: "#ffcc66",
        fontSize: "11px",
      });

      this.inputEl = document.createElement("input");
      this.inputEl.type = "text";
      this.inputEl.placeholder = "help, modules, stats, entities";
      Object.assign(this.inputEl.style, {
        flex: "1 1 auto",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "3px",
        color: "#e0e0e0",
        fontSize: "11px",
        padding: "3px 5px",
        outline: "none",
      });

      this.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const cmd = this.inputEl.value.trim();
          this.inputEl.value = "";
          if (cmd) this.runCommand(cmd);
        } else if (e.key === "Escape") {
          this.toggle(false);
        }
      });

      inputRow.appendChild(prompt);
      inputRow.appendChild(this.inputEl);

      this.root.appendChild(header);
      this.root.appendChild(this.logEl);
      this.root.appendChild(inputRow);

      document.body.appendChild(this.root);

      this.printLine("APEXCORE v4.4 Debug Console ready. Type 'help' for commands.");
    },

    bindHotkey() {
      window.addEventListener("keydown", (e) => {
        // Ignore if typing in an input/textarea outside console
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (e.key === "`") {
          e.preventDefault();
          this.toggle();
        }
      });
    },

    toggle(force) {
      this.visible = typeof force === "boolean" ? force : !this.visible;
      this.root.style.display = this.visible ? "flex" : "none";
      if (this.visible) {
        this.inputEl.focus();
        this.scrollToBottom();
      }
    },

    printLine(text) {
      const line = document.createElement("div");
      line.textContent = text;
      this.logEl.appendChild(line);
      this.scrollToBottom();
    },

    scrollToBottom() {
      this.logEl.scrollTop = this.logEl.scrollHeight;
    },

    runCommand(cmd) {
      this.printLine("> " + cmd);

      const [base, ...rest] = cmd.split(" ");
      const arg = rest.join(" ").trim();

      switch (base.toLowerCase()) {
        case "help":
          this.printLine("Commands:");
          this.printLine("  help        — show this help");
          this.printLine("  modules     — list registered modules");
          this.printLine("  stats       — show tick profiler stats");
          this.printLine("  entities    — show entity count");
          this.printLine("  clear       — clear console output");
          break;

        case "modules": {
          const modules = APEX.all();
          const keys = Object.keys(modules);
          this.printLine(`Modules (${keys.length}):`);
          keys.forEach((k) => this.printLine("  - " + k));
          break;
        }

        case "stats": {
          const tp = window.APEX_TICK_PROFILER;
          if (!tp) {
            this.printLine("No tick profiler data yet.");
          } else {
            this.printLine(
              `Tick Stats — last: ${tp.last.toFixed(2)} ms, avg: ${tp.avg.toFixed(
                2
              )} ms, min: ${tp.min.toFixed(2)} ms, max: ${tp.max.toFixed(
                2
              )} ms, samples: ${tp.samples}`
            );
          }
          break;
        }

        case "entities": {
          const entities = APEX.get("entities");
          if (!entities) {
            this.printLine("Entities module not found.");
          } else {
            const count =
              typeof entities.count === "function"
                ? entities.count()
                : (entities.list && entities.list.length) || 0;
            this.printLine(`Entities: ${count}`);
          }
          break;
        }

        case "clear":
          this.logEl.textContent = "";
          break;

        default:
          this.printLine(`Unknown command: ${base}`);
          this.printLine("Type 'help' for available commands.");
          break;
      }
    },
  };

  APEX.register("debug-console", DebugConsole);
})();
