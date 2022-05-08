import prompts from "prompts";
import { program } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import util from "node:util";
import * as fsWalk from "@nodelib/fs.walk";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Routes } from "discord-api-types/v10";

const runGenerate = async () => {
  const options = program.opts();
  const dir = path.resolve(options.dir || ".");

  if (!(await fs.stat(dir)).isDirectory()) {
    console.error(`${chalk.red(`${dir} is not a directory`)}`);
    process.exit(1);
  }

  dotenv.config({ path: path.join(dir, ".env") });

  if (!process.env.DISNEXT_DISCORD_TOKEN) {
    console.error('Missing "DISNEXT_DISCORD_TOKEN" in .env');
    process.exit(1);
  }

  if (!process.env.DISNEXT_DISCORD_APPLICATION_ID) {
    console.error('Missing "DISNEXT_DISCORD_APPLICATION_ID" in .env');
    process.exit(1);
  }

  if (!process.env.DISNEXT_DISCORD_PUBLIC_KEY) {
    console.error('Missing "DISNEXT_DISCORD_PUBLIC_KEY" in .env');
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
    name: "guildOnly",
    message: "Is this command guild only?",
    initial: false,
  });

  const pushCommand = await prompts({
    type: "toggle",
    name: "push",
    message: "Should this command be pushed to discord?",
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

  if (pushCommand.push) {
    const pushGuild = await prompts({
      type: "text",
      name: "guild",
      message: "What guild should this command be pushed to?",
    });

    if (!pushGuild.guild) {
      await fetch(
        Routes.applicationCommands(process.env.DISNEXT_DISCORD_APPLICATION_ID),
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${process.env.DISNEXT_DISCORD_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: commandName.name,
            type: 1,
            description: commandDescription.description,
          }),
        }
      );
    } else {
      await fetch(
        Routes.applicationGuildCommands(
          process.env.DISNEXT_DISCORD_APPLICATION_ID,
          pushGuild.guild
        ),
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${process.env.DISNEXT_DISCORD_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: commandName.name,
            type: 1,
            description: commandDescription.description,
          }),
        }
      );
    }
  }

  const writeTS = `
  import type { CommandLocale, CommandRun, CommandPermissions } from "disnext";

  export const description: string = "${commandDescription.description}";

  export const permissions: CommandPermissions = {
    dm: ${guildOnly.guildOnly ? "false" : "true"},
  }

  export const run: CommandRun<typeof permissions> = async () => {
    // Your code goes here
  }
  `;

  await fs.writeFile(path.join(commandsDir, `${commandName.name}.ts`), writeTS);

  console.log(`${chalk.green(`Created ${commandName.name}`)}`);
};

runGenerate();
