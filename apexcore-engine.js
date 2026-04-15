// FILE: apexcore-engine.js
/*
    APEXCORE Engine v4.4
    Central lifecycle, module registry, and update loop.
*/

(function () {
  if (!window.APEX) {
    window.APEX = {};
  }

  const APEX = window.APEX;

  // --- MODULE REGISTRY ------------------------------------------------------

  const registry = {};
  const orderedModules = [];

  APEX.register = function register(name, module) {
    if (!name || !module) {
      console.warn("APEX.register: invalid module registration", name, module);
      return;
    }

    if (registry[name]) {
      console.warn(`APEX.register: module '${name}' already registered, replacing.`);
    }

    registry[name] = module;

    if (!orderedModules.includes(name)) {
      orderedModules.push(name);
    }

    if (typeof module.onRegister === "function") {
      try {
        module.onRegister(APEX);
      } catch (err) {
        console.error(`APEX.register: error in onRegister for '${name}'`, err);
      }
    }
  };

  APEX.getModule = function getModule(name) {
    return registry[name] || null;
  };

  APEX.listModules = function listModules() {
    return [...orderedModules];
  };

  // --- ENGINE STATE ---------------------------------------------------------

  let started = false;
  let lastTime = 0;
  let ticking = false;

  // --- LIFECYCLE HELPERS ----------------------------------------------------

  function callIfExists(module, fnName, dt) {
    const fn = module && module[fnName];
    if (typeof fn === "function") {
      try {
        if (dt !== undefined) fn(dt);
        else fn();
      } catch (err) {
        console.error(`APEX Engine: error in ${fnName}() for module`, module, err);
      }
    }
  }

  function initModules() {
    orderedModules.forEach((name) => {
      const mod = registry[name];
      callIfExists(mod, "init");
    });
  }

  function startModules() {
    orderedModules.forEach((name) => {
      const mod = registry[name];
      callIfExists(mod, "start");
    });
  }

  function updateModules(dt) {
    orderedModules.forEach((name) => {
      const mod = registry[name];
      callIfExists(mod, "update", dt);
    });
  }

  // --- MAIN LOOP ------------------------------------------------------------

  function tick(timestamp) {
    if (!ticking) return;

    if (!lastTime) {
      lastTime = timestamp;
    }

    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;

    updateModules(dt);

    window.requestAnimationFrame(tick);
  }

  // --- PUBLIC ENGINE API ----------------------------------------------------

  APEX.start = function start() {
    if (started) return;
    started = true;

    console.log("APEX Engine v4.4 — Starting...");

    initModules();
    startModules();

    ticking = true;
    lastTime = 0;
    window.requestAnimationFrame(tick);

    console.log("APEX Engine v4.4 — Running.");
  };

  APEX.stop = function stop() {
    ticking = false;
    console.log("APEX Engine v4.4 — Stopped.");
  };

  APEX.restart = function restart() {
    APEX.stop();
    started = false;
    APEX.start();
  };
})();
