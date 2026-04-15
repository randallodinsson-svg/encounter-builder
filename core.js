// FILE: core.js
// Minimal APEX registry for NUKE baseline

(function () {
  const modules = {};

  const APEX = {
    register(name, mod) {
      modules[name] = mod;
    },
    getModule(name) {
      return modules[name] || null;
    },
    listModules() {
      return Object.keys(modules);
    },
    _all() {
      return modules;
    },
  };

  window.APEX = APEX;
})();
