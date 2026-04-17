// apexcore-events.js
// DROP AND REPLACE EVERYTHING IN THIS FILE

import { getCurrentState } from "./engine/StateEngine/src/index.js"

const eventQueue = []

const handlers = {}

export function registerEventHandler(type, fn) {
  handlers[type] = handlers[type] || []
  handlers[type].push(fn)
}

export function emitEvent(event) {
  eventQueue.push(event)
}

export function processEventQueue() {
  const futures = []
  const baseState = getCurrentState()

  while (eventQueue.length > 0) {
    const event = eventQueue.shift()
    const list = handlers[event.type] || []

    for (const handler of list) {
      const result = handler(event, baseState)

      if (result?.proposedState) {
        futures.push(result)
      }

      if (result?.emittedEvents) {
        for (const e of result.emittedEvents) {
          emitEvent(e)
        }
      }
    }
  }

  return futures
}
