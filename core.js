// core.js — APEXCORE module registry

window.APEX = (function () {
  const modules = {};
  const ordered = [];

  function register(name, mod) {
    modules[name] = mod;
    ordered.push({ name, mod });
  }

  function getModule(name) {
    return modules[name] || null;
  }

  function startAll() {
    for (const { mod } of ordered) {
      if (typeof mod.start === "function") {
        mod.start();
      }
    }
  }

  function updateAll(dt) {
    for (const { mod } of ordered) {
      if (typeof mod.update === "function") {
        mod.update(dt);
      }
    }
  }

  return {
    register,
    getModule,
    startAll,
    updateAll,
  };
})();
