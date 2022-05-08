import { program } from "commander";
import dotenv from "dotenv";
import path, { basename } from "node:path";
import listen from "../server/index.js";
import fs from "node:fs/promises";
import chalk from "chalk";
import util from "node:util";
import * as fsWalk from "@nodelib/fs.walk";
import type { Command as CommandType } from "../server/commands/command.js";
import commands from "../server/commands/index.js";
import { fileURLToPath } from "node:url";
import { register } from "ts-node";

const runDev = async () => {
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

  const port = Number(process.env.PORT || 3000);

  const commandsDir = path.resolve(path.join(dir, "commands"));

  if (!(await fs.stat(commandsDir)).isDirectory()) {
    console.error(`${chalk.red(`${commandsDir} is not a directory`)}`);
    process.exit(1);
  }

  const paths = await util.promisify(fsWalk.walk)(commandsDir);

  register({
    esm: true,
    cwd: dir,
  });

  for (const path of paths) {
    if (path.path.endsWith(".js.map") || path.path.endsWith(".d.ts")) continue;
    if (path.path.endsWith(".ts") || path.path.endsWith(".js")) {
      const cmdName = basename(
        path.path,
        path.path.endsWith(".js") ? ".js" : ".ts"
      );
      const p: typeof CommandType = await import(path.path);
      commands.add(cmdName, p);
    }
  }

  listen(port);
};

runDev();
