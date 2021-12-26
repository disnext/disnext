import {
  APIChatInputApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionDataResolved,
  APIInteractionGuildMember,
  ApplicationCommandOptionType,
} from "discord-api-types";
import QuartzClient, {
  CommandOption,
  inferOptions,
  Member,
  User,
} from "../../";
import BaseInteraction from "./BaseInteraction";

class ChatInputInteraction<
  T extends Record<string, CommandOption<boolean>> | undefined,
  U extends object
> extends BaseInteraction {
  name: string;
  context?: U;
  options: inferOptions<T>;
  readonly resolved:
    | APIChatInputApplicationCommandInteractionDataResolved
    | undefined;
  constructor(
    client: QuartzClient,
    data: APIChatInputApplicationCommandInteraction,
    respond: ({ code, body }: { code: number; body: object }) => void
  ) {
    super(client, data, respond);
    this.name = data.data.name;
    this.resolved = data.data.resolved;
    this.options = Object.fromEntries(
      data.data.options?.map((option) => {
        if (
          option.type !== ApplicationCommandOptionType.Subcommand &&
          option.type !== ApplicationCommandOptionType.SubcommandGroup
        ) {
          if (option.type === ApplicationCommandOptionType.User) {
            const member = this.resolved?.members?.[option.value];
            const user = this.resolved?.users?.[option.value];
            if (!member || !user || !this.guildID)
              throw new Error("Unable to resolve member");
            return [
              option.name,
              {
                ...new Member(member, this.guildID),
                user: new User(user),
              },
            ];
          } else if (option.type === ApplicationCommandOptionType.Role) {
            const role = this.resolved?.roles?.[option.value];
            if (!role) throw new Error("Unable to resolve role");
            return [option.name, role];
          } else if (option.type === ApplicationCommandOptionType.Channel) {
            const channel = this.resolved?.channels?.[option.value];
            if (!channel) throw new Error("Unable to resolve channel");
            return [option.name, channel];
          } else if (option.type === ApplicationCommandOptionType.Mentionable) {
            const mentionable =
              this.resolved?.members?.[option.value] ??
              this.resolved?.roles?.[option.value];
            const user = this.resolved?.users?.[option.value];
            if (!mentionable || !this.guildID)
              throw new Error("Unable to resolve mentionable");
            return [
              option.name,
              this.resolved?.members?.[option.value] && user
                ? {
                    ...new Member(
                      mentionable as APIInteractionGuildMember,
                      this.guildID
                    ),
                    user: new User(user),
                  }
                : mentionable,
            ];
          }
          return [option.name, option.value];
        } else {
          return [option.name, option.options];
        }
      }) ?? []
    );
  }
}

export default ChatInputInteraction;
