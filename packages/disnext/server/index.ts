import http from "node:http";
import handleInteractions from "./interaction/index.js";

const listen = (port: number = 3000) => {
  http.createServer(handleInteractions).listen(port);
};

export default listen;
