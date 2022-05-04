import { Command } from "./command.js";

class Commands {
  #store: Map<string, typeof Command> = new Map();

  add(commandName: string, cmd: typeof Command) {
    this.#store.set(commandName, cmd);
  }

  get(commandName: string) {
    return this.#store.get(commandName);
  }
}

export default new Commands();
