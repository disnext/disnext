import http, { IncomingMessage, ServerResponse } from "http";
import nacl from "tweetnacl";
import { Readable } from "stream";
import {
  Command,
  CommandOption,
  FollowUp,
  inferMiddlewareContextTypes,
  MiddlewareFunction,
  SendOptions,
} from "./commands";
import {
  APIPingInteraction,
  APIApplicationCommandInteraction,
  APIMessageComponentInteraction,
  InteractionType,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  APIChannel,
  APIGuild,
  InteractionResponseType,
  APIMessage,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  APIInteractionGuildMember,
} from "discord-api-types";

import { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import { DiscordAPI, streamToString } from "./util";
import Guild from "./structures/Guild";
import User from "./structures/User";
import Member from "./structures/Member";

class QuartzClient {
  applicationID: string;
  publicKey: string;
  token: string;
  middlewares: MiddlewareFunction<any, any>[] = [];
  private commands: Command<
    Record<string, CommandOption<any>>,
    inferMiddlewareContextTypes<typeof this.middlewares>
  >[] = [];

  constructor({
    applicationID,
    publicKey,
    token,
  }: {
    applicationID: string;
    publicKey: string;
    token: string;
  }) {
    this.applicationID = applicationID;
    this.publicKey = publicKey;
    this.token = token;
    this.handle = this.handle.bind(this);
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const signature = req.headers["x-signature-ed25519"] as string | undefined;
    const timestamp = req.headers["x-signature-timestamp"] as
      | string
      | undefined;

    if (!signature || !timestamp) {
      res.statusCode = 401;
      res.end();
      return;
    }

    const data = await streamToString(req);

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + data),
      Buffer.from(signature, "hex"),
      Buffer.from(this.publicKey, "hex")
    );

    if (!isVerified) {
      res.statusCode = 401;
      res.end();
      return;
    }

    const interaction = JSON.parse(data) as
      | APIPingInteraction
      | APIApplicationCommandInteraction
      | APIMessageComponentInteraction
      | APIApplicationCommandAutocompleteInteraction;

    switch (interaction.type) {
      case InteractionType.Ping: {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ type: InteractionType.Ping }));
        return;
      }

      case InteractionType.ApplicationCommand: {
        switch (interaction.data.type) {
          case ApplicationCommandType.ChatInput: {
            const resolved = interaction.data.resolved;

            const command = this.commands.find(
              (c) => interaction.data.name === c.name
            );

            if (!command) {
              res.statusCode = 400;
              res.end();
              return;
            }

            const options = Object.fromEntries(
              interaction.data.options?.map((option) => {
                if (
                  option.type !== ApplicationCommandOptionType.Subcommand &&
                  option.type !== ApplicationCommandOptionType.SubcommandGroup
                ) {
                  if (option.type === ApplicationCommandOptionType.User) {
                    const member = resolved?.members?.[option.value];
                    const user = resolved?.users?.[option.value];
                    if (!member || !user || !interaction.guild_id)
                      throw new Error("Unable to resolve member");
                    return [
                      option.name,
                      {
                        ...new Member(member, interaction.guild_id),
                        user: new User(user),
                      },
                    ];
                  } else if (
                    option.type === ApplicationCommandOptionType.Role
                  ) {
                    const role = resolved?.roles?.[option.value];
                    if (!role) throw new Error("Unable to resolve role");
                    return [option.name, role];
                  } else if (
                    option.type === ApplicationCommandOptionType.Channel
                  ) {
                    const channel = resolved?.channels?.[option.value];
                    if (!channel) throw new Error("Unable to resolve channel");
                    return [option.name, channel];
                  } else if (
                    option.type === ApplicationCommandOptionType.Mentionable
                  ) {
                    const mentionable =
                      resolved?.members?.[option.value] ??
                      resolved?.roles?.[option.value];
                    const user = resolved?.users?.[option.value];
                    if (!mentionable || !interaction.guild_id)
                      throw new Error("Unable to resolve mentionable");
                    return [
                      option.name,
                      resolved?.members?.[option.value] && user
                        ? {
                            ...new Member(
                              mentionable as APIInteractionGuildMember,
                              interaction.guild_id
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

            let sent = false;

            const followUp: FollowUp = {
              send: async ({
                allowedMentions,
                ephemeral,
                ...rest
              }: SendOptions & { ephemeral?: boolean }) =>
                (
                  await DiscordAPI.post<APIMessage>(
                    `/webhooks/${this.applicationID}/${interaction.token}`,
                    {
                      content: "content" in rest ? rest.content : undefined,
                      embeds: "embeds" in rest ? rest.embeds : undefined,
                      allowed_mentions: allowedMentions,
                      flags: ephemeral ? 1 << 6 : undefined,
                    },
                    {
                      headers: {
                        Authorization: `Bot ${this.token}`,
                      },
                    }
                  )
                ).data,
              delete: async (messageID?: string) => {
                await DiscordAPI.delete(
                  `/webhooks/${this.applicationID}/${
                    interaction.token
                  }/messages/${messageID ?? "@original"}`,
                  {
                    headers: {
                      Authorization: `Bot ${this.token}`,
                    },
                  }
                );
              },
              edit: async (
                { allowedMentions, ...rest }: SendOptions,
                messageID?: string
              ) =>
                (
                  await DiscordAPI.patch<APIMessage>(
                    `/webhooks/${this.applicationID}/${
                      interaction.token
                    }/messages/${messageID ?? "@original"}`,
                    {
                      content: "content" in rest ? rest.content : undefined,
                      embeds: "embeds" in rest ? rest.embeds : undefined,
                      allowed_mentions: allowedMentions,
                    },
                    {
                      headers: {
                        Authorization: `Bot ${this.token}`,
                      },
                    }
                  )
                ).data,
            };

            const handlerContext = {
              user: interaction.user ? new User(interaction.user) : undefined,
              member:
                interaction.member && interaction.guild_id
                  ? new Member(interaction.member, interaction.guild_id)
                  : undefined,
              channelID: interaction.channel_id,
              guildID: interaction.guild_id,
              name: interaction.data.name,
              channel: async () =>
                (
                  await DiscordAPI.get<APIChannel>(
                    `/channels/${interaction.channel_id}`,
                    {
                      headers: {
                        Authorization: `Bot ${this.token}`,
                      },
                    }
                  )
                ).data,
              guild: async () => {
                if (!interaction.guild_id) return;
                const rawGuild = (
                  await DiscordAPI.get<APIGuild>(
                    `/guilds/${interaction.guild_id}`,
                    {
                      headers: {
                        Authorization: `Bot ${this.token}`,
                      },
                    }
                  )
                ).data;
                if (!rawGuild) return;
                return new Guild(rawGuild, this.token);
              },
              send: ({
                allowedMentions,
                ephemeral,
                ...rest
              }: SendOptions & { ephemeral?: boolean }) => {
                if (sent)
                  throw new Error("Cannot defer when response is already sent");
                res.statusCode = 200;
                res.setHeader("content-type", "application/json");
                res.end(
                  JSON.stringify({
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                      content: "content" in rest ? rest.content : undefined,
                      embeds: "embeds" in rest ? rest.embeds : undefined,
                      allowed_mentions: allowedMentions,
                      flags: ephemeral ? 1 << 6 : undefined,
                    },
                  })
                );
                sent = true;
                return followUp;
              },
              defer: () => {
                if (sent)
                  throw new Error("Cannot defer when response is already sent");
                res.statusCode = 200;
                res.setHeader("content-type", "application/json");
                res.end({
                  type: InteractionResponseType.DeferredChannelMessageWithSource,
                });
                sent = true;
                return followUp;
              },
              options,
              context: {},
            };

            for (const middleware of this.middlewares) {
              const res = await middleware(handlerContext);
              if (!res.next) {
                return;
              }
              handlerContext.context = res.ctx;
            }

            command.handler(handlerContext);

            return;
          }
          case ApplicationCommandType.Message: {
            return;
          }
          case ApplicationCommandType.User: {
            return;
          }
        }
      }

      case InteractionType.MessageComponent: {
        return;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        return;
      }
    }
  }

  listen(port: number = 3000, address: string = "localhost") {
    if (
      process.argv[1] === "push" ||
      (!!process.argv[2] && process.argv[2] === "push")
    ) {
      import("./cli").then((cli) => cli.loadCli(this));
      return;
    }
    http.createServer(this.handle).listen(port, address);
  }

  command<T extends Record<string, CommandOption<boolean>> | undefined>(
    options: Command<T, inferMiddlewareContextTypes<this["middlewares"]>>
  ) {
    this.commands.push(options as any);
  }

  middleware<T extends object>(
    this: this,
    middleware: MiddlewareFunction<
      inferMiddlewareContextTypes<this["middlewares"]>,
      T
    >
  ): asserts this is this & { middlewares: typeof middleware[] } {
    this.middlewares.push(middleware);
  }

  generateCommands(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return this.commands.map((command) => ({
      name: command.name,
      description: command.description,
      options: Object.entries(command.options ?? {}).map(([name, value]) => ({
        type: value.type,
        name,
        description: value.description,
        required: value.required ?? false,
        ...("choices" in value ? { choices: value.choices } : {}),
        ...("types" in value ? { channel_types: value.types } : {}),
        ...("minValue" in value ? { min_value: value.minValue } : {}),
        ...("maxValue" in value ? { max_value: value.maxValue } : {}),
      })) as any,
      default_permission: command.defaultPermission ?? true,
      type: ApplicationCommandType.ChatInput,
    }));
  }

  async overwriteCommands() {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/commands`,
      this.generateCommands(),
      {
        headers: {
          Authorization: `Bot ${this.token}`,
        },
      }
    );
  }

  async overwriteGuildCommands(guildID: string) {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/guilds/${guildID}/commands`,
      this.generateCommands(),
      {
        headers: {
          Authorization: `Bot ${this.token}`,
        },
      }
    );
  }
}

export default QuartzClient;
export * from "./commands";
