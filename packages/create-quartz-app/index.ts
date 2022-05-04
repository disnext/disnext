#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import validateProjectName from "validate-npm-package-name";
import path from "node:path";
import fs from "fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";
import cpy from "cpy";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let appPath: string = "";

const allowedFiles = [
  ".DS_Store",
  ".git",
  ".gitignore",
  ".gitattributes",
  ".gitlab-ci.yml",
  ".idea",
  ".vscode",
  ".npmignore",
  "LICENSE",
  "npm-debug.log",
  "yarn-debug.log",
  "yarn-error.log",
];

new Command()
  .arguments("[app_directory")
  .usage(`${chalk.green("[app_directory]")} [options]`)
  .action((name) => {
    appPath = name;
  })
  .parse(process.argv);

const run = async () => {
  if (typeof appPath === "string") {
    appPath = appPath.trim();
  }

  if (!appPath) {
    const res = await prompts({
      type: "text",
      name: "path",
      message: "What is your app named?",
      initial: "my-discord-app",
      validate: (name) => {
        const valid = validateProjectName(path.basename(path.resolve(name)));
        if (valid.validForNewPackages) return true;
        return `Invalid app name: ${
          [...(valid.errors || []), ...(valid.warnings || [])][0]
        }`;
      },
    });

    if (typeof res.path === "string") {
      appPath = res.path.trim();
    }
  }

  if (!appPath) {
    console.error(`${chalk.red("No app path provided")}`);
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(appPath);
  const appName = path.basename(resolvedProjectPath);
  const valid = validateProjectName(appName);

  if (!valid.validForNewPackages) {
    console.error(
      `${chalk.red(
        "Invalid app name: " +
          [...(valid.errors || []), ...(valid.warnings || [])][0]
      )}`
    );
    process.exit(1);
  }

  await fs.mkdir(appPath, { recursive: true });

  const possibleConflicts = (await fs.readdir(resolvedProjectPath)).filter(
    (file) => !allowedFiles.includes(file)
  );

  if (possibleConflicts.length > 0) {
    console.error(
      `${chalk.red(
        "The directory already exists and contains files that could conflict. Please move it out of the way before continuing."
      )}`
    );
    process.exit(1);
  }

  console.log(`Creating a new discord app in ${chalk.green(appPath)}`);
  console.log();

  process.chdir(resolvedProjectPath);

  const generatedPackageJson = {
    name: appName,
    version: "0.0.0",
    private: true,
    scripts: {
      dev: "quartz dev",
      generate: "quartz generate",
      build: "quartz build",
      start: "quartz start",
    },
  };

  await fs.writeFile(
    path.join(resolvedProjectPath, "package.json"),
    JSON.stringify(generatedPackageJson, null, 2) + os.EOL
  );

  // const dependencies = ["@pointsbot/quartz"];

  const devDependencies = ["typescript", "@types/node", "discord-api-types"];

  console.log();
  console.log("Installing packages. This might take a couple of minutes.");

  // await install(resolvedProjectPath, dependencies);
  await install(resolvedProjectPath, devDependencies, true);

  console.log(resolvedProjectPath, path.resolve(path.join(__dirname, "..")));

  await cpy("template/**", resolvedProjectPath, {
    cwd: path.resolve(path.join(__dirname, "..")),
    rename: (name) => {
      switch (name) {
        case "gitignore":
          return ".".concat(name);
        case "README-template.md":
          return "README.md";
        case "env":
          return ".env";
        case "tsconfig-template.json":
          return "tsconfig.json";
        default:
          return name;
      }
    },
  });

  let cdpath: string;
  if (path.join(process.cwd(), appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(chalk.cyan("  yarn dev"));
  console.log("    Starts the development server.");
  console.log();
  console.log(chalk.cyan("  yarn generate"));
  console.log("    Generates a new command.");
  console.log();
  console.log(chalk.cyan("  yarn build"));
  console.log("    Bundles the app into static files for production.");
  console.log();
  console.log(chalk.cyan("  yarn start"));
  console.log("    Starts the app.");
  console.log();
  console.log("We suggest that you begin by configuring .env then running:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(chalk.cyan("  yarn dev"));
  console.log();
};

const install = async (path: string, deps: string[], dev?: boolean) => {
  return new Promise((resolve, reject) => {
    const args = ["add", "--exact"];
    args.push("--cwd", path);
    if (dev) args.push("--dev");
    args.push(...deps);

    const proc = spawn("yarn", args, {
      stdio: "inherit",
      env: process.env,
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve(undefined);
      }
    });
  });
};

run();
