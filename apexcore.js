// apexcore.js
// Minimal APEXCORE registry + API for HALO + UI.

export const APEXCORE = (() => {
  const _registry = {};
  const _timeline = [];
  const _diff = [];
  const _profiler = {
    modules: {},
  };
  const _modules = [];

  function _pushTimeline(type, payload) {
    _timeline.push({
      ts: Date.now(),
      type,
      payload,
    });
    if (_timeline.length > 200) _timeline.shift();
  }

  function register(id, moduleObj) {
    if (!id || !moduleObj) return;
    _registry[id] = {
      id,
      mounted: false,
    };
    _modules.push(moduleObj);
    _pushTimeline("register", { id });
    console.log("[APEXCORE] Module registered:", id);
  }

  function mount(id) {
    const mod = _modules.find(m => m.id === id);
    if (!mod) return;
    if (typeof mod.init === "function") {
      mod.init(APEXCORE);
    }
    if (_registry[id]) {
      _registry[id].mounted = true;
    }
    _pushTimeline("mount", { id });
    console.log("[APEXCORE] Module mounted:", id);
  }

  function set(key, value) {
    _registry[key] = value;
    _diff.push({ ts: Date.now(), key, value });
    if (_diff.length > 200) _diff.shift();
  }

  function get(key) {
    return _registry[key];
  }

  function dump() {
    return {
      registry: _registry,
      timeline: _timeline,
      diff: _diff,
      profiler: _profiler,
    };
  }

  function getDiff() {
    return _diff;
  }

  function getTimeline() {
    return _timeline;
  }

  const api = {
    set,
    get,
    dump,
    getDiff,
    getTimeline,
  };

  return {
    api,
    register,
    mount,
    _modules,
    _profiler,
  };
})();

// Auto-mount known modules after they register themselves
window.APEXCORE = APEXCORE;
