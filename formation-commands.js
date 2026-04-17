// formation-commands.js
// DROP AND REPLACE EVERYTHING IN THIS FILE

const commandExecutors = {}

export function registerCommandExecutor(type, fn) {
  commandExecutors[type] = fn
}

export function executeCommand(command, state) {
  const exec = commandExecutors[command.type]
  if (!exec) return null

  return exec(command, state)
}
