// FILE: apexcore-events.js
/*
    APEXCORE.Events v4.4
    Global event bus for module communication.
*/

(function () {
  if (!window.APEX) {
    console.warn("APEXCORE.Events: APEX not found.");
    return;
  }

  const APEX = window.APEX;

  const listeners = {};

  function ensureBucket(event) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
  }

  const Events = {
    on(event, handler) {
      if (typeof handler !== "function") return;
      ensureBucket(event);
      listeners[event].push({ handler, once: false });
    },

    once(event, handler) {
      if (typeof handler !== "function") return;
      ensureBucket(event);
      listeners[event].push({ handler, once: true });
    },

    off(event, handler) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(
        (entry) => entry.handler !== handler
      );
    },

    emit(event, data) {
      if (!listeners[event]) return;

      listeners[event] = listeners[event].filter((entry) => {
        try {
          entry.handler(data);
        } catch (err) {
          console.error(`APEXCORE.Events: error in handler for '${event}'`, err);
        }
        return !entry.once;
      });
    },

    clear(event) {
      if (event) delete listeners[event];
      else Object.keys(listeners).forEach((e) => delete listeners[e]);
    },
  };

  // Register with APEX
  APEX.register("events", Events);
})();
