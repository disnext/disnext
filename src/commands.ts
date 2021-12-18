import {
  APIChannel,
  APIGuildMember,
  APIRole,
  APIUser,
  ApplicationCommandOptionType,
  ChannelType,
} from "discord-api-types";

export interface BaseCommandOption<T extends true | false> {
  description: string;
  required?: T;
  type: ApplicationCommandOptionType;
}

export interface StringCommandOption<
  T extends Record<string, string>,
  U extends true | false
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.String;
  choices?: T;
}

export interface IntegerCommandOption<
  T extends Record<string, number>,
  U extends true | false
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Integer;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

export interface BooleanCommandOption<T extends true | false>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Boolean;
}

export interface UserCommandOption<T extends true | false>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.User;
}

export interface ChannelCommandOption<T extends true | false>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Channel;
  types?: ChannelType[];
}

export interface RoleCommandOption<T extends true | false>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Role;
}

export interface MentionableCommandOption<T extends true | false>
  extends BaseCommandOption<T> {
  type: ApplicationCommandOptionType.Mentionable;
}

export interface NumberCommandOption<
  T extends Record<string, number>,
  U extends true | false
> extends BaseCommandOption<U> {
  type: ApplicationCommandOptionType.Number;
  minValue?: number;
  maxValue?: number;
  choices?: T;
}

type CommandOption<T extends true | false> =
  | StringCommandOption<any, T>
  | IntegerCommandOption<any, T>
  | BooleanCommandOption<T>
  | UserCommandOption<T>
  | ChannelCommandOption<T>
  | RoleCommandOption<T>
  | MentionableCommandOption<T>
  | NumberCommandOption<any, T>;

type inferOption<T extends CommandOption<true | false>> =
  T extends StringCommandOption<any, any>
    ? string
    : T extends IntegerCommandOption<any, any>
    ? number
    : T extends BooleanCommandOption<any>
    ? boolean
    : T extends UserCommandOption<any>
    ? APIGuildMember
    : T extends ChannelCommandOption<any>
    ? APIChannel
    : T extends RoleCommandOption<any>
    ? APIRole
    : T extends MentionableCommandOption<any>
    ? APIGuildMember | APIRole
    : T extends NumberCommandOption<any, any>
    ? number
    : never;

type inferRequiredOption<T extends CommandOption<true | false>> =
  T extends CommandOption<true> ? inferOption<T> : inferOption<T> | undefined;

type ValueOf<T> = T[keyof T];

type inferChoices<T extends CommandOption<true | false>> =
  T extends StringCommandOption<infer U, any>
    ? ValueOf<U>
    : T extends IntegerCommandOption<infer U, any>
    ? keyof U
    : T extends NumberCommandOption<infer U, any>
    ? keyof U
    : inferRequiredOption<T>;

type inferOptions<T extends Record<string, CommandOption<true | false>>> = {
  [K in keyof T]: inferChoices<T[K]>;
};

type inferCommand<T extends Command<any>> = T extends Command<infer U>
  ? inferOptions<U>
  : never;

export interface Command<
  T extends Record<string, CommandOption<true | false>>
> {
  name: string;
  description: string;
  options?: T;
  handler: (ctx: { options: inferOptions<T> }) => void;
}

export const options = {
  string<T extends Record<string, string>, U extends true | false>(
    options: Omit<StringCommandOption<T, U>, "type">
  ): StringCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.String };
  },
  integer<T extends Record<string, number>, U extends true | false>(
    options: Omit<IntegerCommandOption<T, U>, "type">
  ): IntegerCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Integer };
  },
  boolean<U extends true | false>(
    options: Omit<BooleanCommandOption<U>, "type">
  ): BooleanCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Boolean };
  },
  user<U extends true | false>(
    options: Omit<UserCommandOption<U>, "type">
  ): UserCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.User };
  },
  channel<U extends true | false>(
    options: Omit<ChannelCommandOption<U>, "type">
  ): ChannelCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Channel };
  },
  role<U extends true | false>(
    options: Omit<RoleCommandOption<U>, "type">
  ): RoleCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Role };
  },
  mentionable<U extends true | false>(
    options: Omit<MentionableCommandOption<U>, "type">
  ): MentionableCommandOption<U> {
    return { ...options, type: ApplicationCommandOptionType.Mentionable };
  },
  number<T extends Record<string, number>, U extends true | false>(
    options: Omit<NumberCommandOption<T, U>, "type">
  ): NumberCommandOption<T, U> {
    return { ...options, type: ApplicationCommandOptionType.Number };
  },
};

export const command = <T extends Record<string, CommandOption<true | false>>>(
  options: Command<T>
): Command<T> => {
  return options;
};

const a = command({
  name: "owo",
  description: "UwU",
  options: {
    name: options.string({
      description: "UwU Me!",
      required: true,
      choices: {
        owo: "uwu",
      },
    }),
    cost: options.number({
      description: "cost of u",
      required: true,
    }),
    user: options.user({
      description: "ur mom",
      required: false,
    }),
  },
  handler: (ctx) => {
    ctx.options.user;
  },
});

type owo = inferCommand<typeof a>;
