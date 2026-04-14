setWeatherPreset(name) {
  switch (name) {

    case "calm":
      this._windSpeed = 0.05;
      this._turbulenceIntensity = 0.2;
      this._vortexIntensity = 0.1;
      this._stormMode = false;
      break;

    case "gusty":
      this._windSpeed = 0.4;
      this._turbulenceIntensity = 1.2;
      this._vortexIntensity = 0.6;
      this._stormMode = false;
      break;

    case "storm":
      this._windSpeed = 0.8;
      this._turbulenceIntensity = 2.0;
      this._vortexIntensity = 1.5;
      this._stormMode = true;
      break;

    case "cyclone":
      this._windSpeed = 0.3;
      this._turbulenceIntensity = 1.0;
      this._vortexIntensity = 3.0;
      this._stormMode = true;
      break;

    case "turbulentSea":
      this._windSpeed = 0.2;
      this._turbulenceIntensity = 3.0;
      this._vortexIntensity = 0.4;
      this._stormMode = false;
      break;

    default:
      console.warn("Unknown weather preset:", name);
  }

  console.log("ENV_FIELD: Weather Preset →", name);
}
