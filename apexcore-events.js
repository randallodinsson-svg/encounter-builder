// apexcore-events.js
// ------------------------------------------------------------
// Central event bus for APEXCORE, backed by StateEngine.
// Uses getCurrentState from StateEngine.
// ------------------------------------------------------------

import {
    initStateEngine,
    getCurrentState,
    mergeState,
    subscribeToStateChanges
} from "./engine/StateEngine/src/index.js";

console.log("APEXCORE EVENTS — initializing…");

initStateEngine();

const _eventListeners = new Map(); // eventType -> Set<listener>

export function onEvent(eventType, listener) {
    if (!_eventListeners.has(eventType)) {
        _eventListeners.set(eventType, new Set());
    }
    _eventListeners.get(eventType).add(listener);
    return () => _eventListeners.get(eventType)?.delete(listener);
}

export function emitEvent(eventType, payload = {}) {
    const listeners = _eventListeners.get(eventType);
    if (!listeners || listeners.size === 0) return;

    const currentState = getCurrentState();

    for (const listener of listeners) {
        try {
            listener({
                type: eventType,
                payload,
                state: currentState
            });
        } catch (err) {
            console.error(`APEXCORE EVENTS — listener error for ${eventType}`, err);
        }
    }
}

export function updateStateFromEvent(partialState) {
    mergeState(partialState);
}

export function onStateChange(listener) {
    return subscribeToStateChanges(listener);
}

console.log("APEXCORE EVENTS — online");
