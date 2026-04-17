// apexcore-engine.js
// DROP AND REPLACE EVERYTHING IN THIS FILE

import { emitEvent, processEventQueue } from "./apexcore-events.js"
import { executeCommand } from "./formation-commands.js"
import { resolveTemporalFutures } from "./phase62-temporal-alignment.js"

// STATE ENGINE (new)
import {
  initState,
  getCurrentState,
  applyState,
  createSnapshot
} from "./engine/StateEngine/src/index.js"

export function runApexCore(initialState, initialEvents = [], initialCommands = []) {
  // Initialize canonical state
  initState(initialState)

  // Seed initial events
  for (const e of initialEvents) {
    emitEvent(e)
  }

  // Execute initial commands
  for (const cmd of initialCommands) {
    const result = executeCommand(cmd, getCurrentState())

    if (result?.proposedState) {
      applyState(result.proposedState, { source: "command" })
    }

    if (result?.emittedEvents) {
      for (const e of result.emittedEvents) {
        emitEvent(e)
      }
    }
  }

  // Process event queue → produces futures
  const futures = processEventQueue(getCurrentState())

  // TPE chooses the winning future
  const chosen = resolveTemporalFutures(futures, getCurrentState())

  // Commit chosen future to State Engine
  if (chosen?.proposedState) {
    applyState(chosen.proposedState, { source: "TPE" })
  }

  // Snapshot after full cycle
  createSnapshot()

  return {
    finalState: getCurrentState(),
    chosenFuture: chosen
  }
}
