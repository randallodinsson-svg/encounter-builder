// engine/StateEngine/src/index.js
// ------------------------------------------------------------
// Minimal StateEngine module entry point.
// This file exists to satisfy the import chain and prevent 404s.
// The full State Engine can be restored later, but this ensures
// the engine boots cleanly right now.
// ------------------------------------------------------------

console.log("StateEngine — module entry loaded");

// Placeholder state object
const _state = {
    initialized: false,
    data: {}
};

// Minimal initializer
export function initStateEngine() {
    if (_state.initialized) {
        console.log("StateEngine — already initialized");
        return;
    }

    _state.initialized = true;
    console.log("StateEngine — initialized (placeholder)");
}

// Minimal getter
export function getState() {
    return _state;
}

// Minimal setter
export function setState(key, value) {
    _state.data[key] = value;
    console.log(`StateEngine — set ${key} =`, value);
}

// Export default object for convenience
export default {
    initStateEngine,
    getState,
    setState
};
