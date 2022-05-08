import prompts from "prompts";
import { program } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import util from "node:util";
import * as fsWalk from "@nodelib/fs.walk";

const runGenerate = async () => {
  const options = program.opts();
  const dir = path.resolve(options.dir || ".");

  if (!(await fs.stat(dir)).isDirectory()) {
    console.error(`${chalk.red(`${dir} is not a directory`)}`);
    process.exit(1);
  }

  const commandsDir = path.resolve(path.join(dir, "commands"));

  if (!(await fs.stat(commandsDir)).isDirectory()) {
    console.error(`${chalk.red(`${commandsDir} is not a directory`)}`);
    process.exit(1);
  }

  const commandName = await prompts({
    type: "text",
    name: "name",
    message: "What would you like to name this command?",
    validate: (name) => {
      if (!/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/.test(name)) {
        return "Invalid command name";
      }
      return true;
    },
  });

  if (!commandName.name) {
    console.error("No command name provided");
    process.exit(1);
  }

  const commandDescription = await prompts({
    type: "text",
    name: "description",
    message: "What would you like to describe this command?",
    validate: (description) => {
      if (!description || description.length < 1 || description.length > 100) {
        return "Invalid command description";
      }
      return true;
    },
  });

  if (!commandDescription.description) {
    console.error("No command description provided");
    process.exit(1);
  }

  const guildOnly = await prompts({
    type: "toggle",
    name: "guild",
    message: "Is this command guild only?",
    initial: false,
  });

  const paths = await util.promisify(fsWalk.walk)(commandsDir);

  const commandExists = paths.find(
    (p) => p.path.split(".")[0] === commandName.name
  );

  if (commandExists) {
    console.error(`${chalk.red(`${commandExists.path} already exists`)}`);
    process.exit(1);
  }

  const writeTS = `
  import type { CommandLocale, CommandRun, CommandPermissions } from "disnext";

  export const description: string = "${commandDescription.description}";

  export const permissions: CommandPermissions = {
    dm: ${guildOnly.guild ? "false" : "true"},
  }

  export const run: CommandRun<typeof permissions> = async () => {
    // Your code goes here
  }
  `;

  await fs.writeFile(path.join(commandsDir, `${commandName.name}.ts`), writeTS);

  console.log(`${chalk.green(`Created ${commandName.name}`)}`);
};

runGenerate();
