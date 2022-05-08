#!/usr/bin/env node --loader ts-node/esm
import { program } from "commander";

program
  .command("generate", "Generate a new command", {
    executableFile: "./generate.js",
  })
  .option("--dir <directory>", "Project directory")
  .parse(process.argv);

program
  .command("dev", "Run the development server", {
    executableFile: "./dev.js",
  })
  .option("-p, --port <port>", "Port to run the server on")
  .option("-t, --tunnel", "Run a tunnel to the server using ngrok")
  .option("--dir <directory>", "Project directory")
  .parse(process.argv);
