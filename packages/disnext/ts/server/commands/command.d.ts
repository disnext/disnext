import { LocaleString } from "discord-api-types/v10";
import {
  CommandLocale,
  CommandPermissions,
  CommandRun,
} from "./commandTypes.js";

module Command {
  declare const permissions: CommandPermissions | undefined;
  declare const description: string;
  declare const locale: CommandLocale | undefined;
  declare const run: CommandRun<typeof permissions>;
}
