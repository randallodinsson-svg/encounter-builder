// engine/StateEngine/src/index.js
// ------------------------------------------------------------
// Minimal but complete State Engine surface for APEXCORE.
// Provides getCurrentState so apexcore-events.js can use it.
// ------------------------------------------------------------

console.log("StateEngine — module entry loaded");

const _state = {
    initialized: false,
    data: {},
    listeners: new Set()
};

export function initStateEngine() {
    if (_state.initialized) return;
    _state.initialized = true;
    console.log("StateEngine — initialized");
}

export function getCurrentState() {
    return _state.data;
}

export function setState(key, value) {
    _state.data[key] = value;
    notifyStateListeners();
}

export function mergeState(partial) {
    Object.assign(_state.data, partial);
    notifyStateListeners();
}

export function subscribeToStateChanges(listener) {
    _state.listeners.add(listener);
    return () => _state.listeners.delete(listener);
}

function notifyStateListeners() {
    for (const listener of _state.listeners) {
        try {
            listener(_state.data);
        } catch (err) {
            console.error("StateEngine — listener error", err);
        }
    }
}

export default {
    initStateEngine,
    getCurrentState,
    setState,
    mergeState,
    subscribeToStateChanges
};
