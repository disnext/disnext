import { LocaleString } from "discord-api-types/v10";
import {
  GuildSlashCommand,
  SlashCommand,
} from "../interaction/commands/slash.js";

type RunCtx<B> = B extends false ? GuildSlashCommand : SlashCommand;

export interface CommandLocale {
  name?: Record<string, string>;
  description?: Record<string, string>;
}

export interface CommandPermissions {
  dm?: boolean;
  permissions?: bigint[];
}

export type CommandRun<P> = (ctx: RunCtx<P>) => void;
