// field-controller.js — presets for environment field

(function () {
  const Controller = {
    start() {
      console.log("FIELD_CONTROLLER — online.");
    },

    applyPreset(name) {
      const env = APEX.getModule("environment-field");
      if (!env) return;

      switch (name) {
        case "Calm":
          env.windDirectionDeg = 0;
          env.windStrength = 10;
          env.turbulence = 0.2;
          env.vortices = 0.2;
          break;
        case "Drift":
          env.windDirectionDeg = 45;
          env.windStrength = 40;
          env.turbulence = 0.4;
          env.vortices = 0.4;
          break;
        case "Swirl":
          env.windDirectionDeg = 90;
          env.windStrength = 30;
          env.turbulence = 0.7;
          env.vortices = 0.9;
          break;
        case "Storm":
          env.windDirectionDeg = 135;
          env.windStrength = 80;
          env.turbulence = 1.0;
          env.vortices = 1.2;
          break;
        case "Collapse":
          env.windDirectionDeg = 180;
          env.windStrength = 20;
          env.turbulence = 0.3;
          env.vortices = 1.4;
          break;
        case "Pulse":
          env.windDirectionDeg = 220;
          env.windStrength = 50;
          env.turbulence = 0.9;
          env.vortices = 1.0;
          break;
        default:
          console.warn("FIELD_CONTROLLER: Unknown preset:", name);
      }
    },
  };

  APEX.register("field-controller", Controller);
})();
