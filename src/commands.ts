import {
  APIChannel,
  APIRole,
  ApplicationCommandOptionType,
  ChannelType,
  APIInteractionDataResolvedGuildMember,
  APIUser,
  APIInteractionDataResolvedChannel,
  APIEmbed,
  AllowedMentionsTypes,
  APIMessage,
} from "discord-api-types";
import Guild from "./structures/Guild";
import Member from "./structures/Member";
import User from "./structures/User";

export interface BaseCommandOption<T extends boolean> {
  description: string;
  required?: T;
  type: ApplicationCommandOptionType;
}

export interface StringCommandOption<
  T extends Record<string, Box<string>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.String;
  choices?: T;
}

export interface IntegerCommandOption<
  T extends Record<string, Box<number>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Integer;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

export interface BooleanCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Boolean;
}

export interface UserCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.User;
}

export interface ChannelCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Channel;
  types?: ChannelType[];
}

export interface RoleCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Role;
}

export interface MentionableCommandOption<T extends boolean>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Mentionable;
}

export interface NumberCommandOption<
  T extends Record<string, Box<number>> | undefined,
  U extends boolean
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Number;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

export type CommandOption<T extends boolean> =
  | StringCommandOption<any, T>
  | IntegerCommandOption<any, T>
  | BooleanCommandOption<T>
  | UserCommandOption<T>
  | ChannelCommandOption<T>
  | RoleCommandOption<T>
  | MentionableCommandOption<T>
  | NumberCommandOption<any, T>;

export type CommandOptionsWithChoices<
  U extends Record<string, Box<any>>,
  T extends boolean
> =
  | StringCommandOption<U, T>
  | IntegerCommandOption<U, T>
  | NumberCommandOption<U, T>;

export type inferBaseOption<T extends CommandOption<boolean>> =
  T extends StringCommandOption<any, any>
    ? string
    : T extends IntegerCommandOption<any, any>
    ? number
    : T extends BooleanCommandOption<any>
    ? boolean
    : T extends UserCommandOption<any>
    ? APIInteractionDataResolvedGuildMember & { user: APIUser }
    : T extends ChannelCommandOption<any>
    ? APIInteractionDataResolvedChannel
    : T extends RoleCommandOption<any>
    ? APIRole
    : T extends MentionableCommandOption<any>
    ? (APIInteractionDataResolvedGuildMember & { user: APIUser }) | APIRole
    : T extends NumberCommandOption<any, any>
    ? number
    : never;

export type Box<T extends string | number> = { value: T };
export type Unbox<T extends Box<any>> = T["value"];
export const literal = <T extends string | number>(value: T): Box<T> => ({
  value,
});

export type inferRequiredOption<T extends CommandOption<boolean>> =
  T extends CommandOption<true>
    ? inferBaseOption<T>
    : inferBaseOption<T> | undefined;

export type inferOption<T extends CommandOption<boolean>> =
  T extends CommandOptionsWithChoices<infer U, any>
    ? [U] extends [undefined]
      ? inferRequiredOption<T>
      : T extends CommandOption<true>
      ? Unbox<U[keyof U]>
      : Unbox<U[keyof U]> | undefined
    : inferRequiredOption<T>;

export type inferOptions<
  T extends Record<string, CommandOption<boolean>> | undefined
> = [T] extends [Record<string, CommandOption<boolean>>]
  ? {
      [K in keyof T]: inferOption<T[K]>;
    }
  : undefined;

export interface BaseSendOptions {
  allowedMentions?: AllowedMentionsTypes;
}

export type SendOptions = BaseSendOptions &
  (
    | {
        content: string;
      }
    | { embeds: [APIEmbed, ...APIEmbed[]] }
    | ({
        content: string;
      } & { embeds: [APIEmbed, ...APIEmbed[]] })
  );

export interface FollowUp {
  send(options: SendOptions & { ephemeral?: boolean }): Promise<APIMessage>;
  edit(options: SendOptions, messageID?: string): Promise<APIMessage>;
  delete(messageID?: string): Promise<void>;
}

export interface HandlerContext<
  T extends Record<string, CommandOption<boolean>> | undefined,
  U extends object
> {
  name: string;
  context: U;
  options: inferOptions<T>;
  channelID: string;
  guildID?: string;
  channel: () => Promise<APIChannel>;
  guild: () => Promise<Guild | undefined>;
  user?: User;
  member?: Member;
  send(options: SendOptions & { ephemeral?: boolean }): FollowUp;
  defer(ephemeral?: boolean): FollowUp;
}

export type MiddlewareResponse<T extends object> =
  | {
      next: true;
      ctx: T;
    }
  | {
      next: false;
    };

export type MiddlewareFunction<T extends object, U extends object> = (
  ctx: HandlerContext<undefined, T>
) => Promise<MiddlewareResponse<U>>;

export type inferMiddlewareContextType<T extends MiddlewareFunction<any, any>> =
  T extends MiddlewareFunction<any, infer U> ? U : {};

export type inferMiddlewareContextTypes<
  T extends MiddlewareFunction<any, any>[]
> = inferMiddlewareContextType<T[number]>;
export interface Command<
  T extends Record<string, CommandOption<boolean>> | undefined,
  U extends object
> {
  name: string;
  description: string;
  options?: T;
  defaultPermission?: boolean;
  handler: (ctx: HandlerContext<T, U>) => void;
}

export type constructMiddleware<T extends MiddlewareFunction<any, any>[]> = {
  middlewares: T;
};

export const options = {
  string<T extends Record<string, Box<string>> | undefined, U extends boolean>(
    options: Omit<StringCommandOption<T, U>, "type">
  ): StringCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.String };
  },
  integer<T extends Record<string, Box<number>> | undefined, U extends boolean>(
    options: Omit<IntegerCommandOption<T, U>, "type">
  ): IntegerCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Integer };
  },
  boolean<U extends boolean>(
    options: Omit<BooleanCommandOption<U>, "type">
  ): BooleanCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Boolean };
  },
  user<U extends boolean>(
    options: Omit<UserCommandOption<U>, "type">
  ): UserCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.User };
  },
  channel<U extends boolean>(
    options: Omit<ChannelCommandOption<U>, "type">
  ): ChannelCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Channel };
  },
  role<U extends boolean>(
    options: Omit<RoleCommandOption<U>, "type">
  ): RoleCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Role };
  },
  mentionable<U extends boolean>(
    options: Omit<MentionableCommandOption<U>, "type">
  ): MentionableCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Mentionable };
  },
  number<T extends Record<string, Box<number>> | undefined, U extends boolean>(
    options: Omit<NumberCommandOption<T, U>, "type">
  ): NumberCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Number };
  },
};
