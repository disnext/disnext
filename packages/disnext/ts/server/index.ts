import http from "node:http";
import handleInteractions from "./interaction/index.js";
import chalk from "chalk";

const listen = (port: number = 3000) => {
  const server = http.createServer(handleInteractions);

  server.on("listening", () => {
    console.log(`${chalk.green(`Listening to port ${port}`)}`);
  });

  server.listen(port);
};

export default listen;
