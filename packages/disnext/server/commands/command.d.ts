import { LocaleString } from "discord-api-types/v10";
import {
  DMSlashCommand,
  GuildSlashCommand,
} from "../interaction/commands/slash";

type RunCtx<B> = B extends false ? GuildSlashCommand : DMSlashCommand;

module Command {
  declare const permissions:
    | {
        dm?: boolean;
        permissions: bigint[];
      }
    | undefined;
  declare const description: string;
  declare const locale:
    | {
        name?: LocaleString;
        description?: LocaleString;
      }
    | undefined;

  declare const run: (ctx: RunCtx<typeof permissions.dm>) => void;
}
