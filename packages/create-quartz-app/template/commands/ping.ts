import { CommandLocale, CommandRun, CommandPermissions } from "disnext";

export const description: string = "Returns pong as a response";
export const locale: CommandLocale = {
  name: {
    "en-US": "Ping",
  },
  description: {
    "en-US": "Returns pong as a response",
  },
};

export const permissions: CommandPermissions = {
  dm: false,
};

export const run: CommandRun = () => {
  console.log("ha");
};
