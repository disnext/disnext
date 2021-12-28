import http, { IncomingMessage, ServerResponse } from "http";
import {
  Command,
  CommandOption,
  inferMiddlewareContextTypes,
  MiddlewareFunction,
} from "./commands";
import {
  APIPingInteraction,
  APIApplicationCommandInteraction,
  APIMessageComponentInteraction,
  InteractionType,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  APIChatInputApplicationCommandInteraction,
} from "discord-api-types";

import { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import { DiscordAPI, streamToString, verify } from "./util";
import Guild from "./structures/Guild";
import User from "./structures/User";
import Member from "./structures/Member";
import ActionRow from "./structures/ActionRow";
import Button from "./structures/Button";
import SelectMenu from "./structures/SelectMenu";
import Embed from "./structures/Embed";
import ChatInputInteraction from "./structures/interactions/ChatInput";
import MessageComponentInteraction from "./structures/interactions/MessageComponent";

class QuartzClient {
  applicationID: string;
  publicKey: string;
  token: string;
  components: Map<
    string,
    {
      handler: (ctx: MessageComponentInteraction) => void;
      expires: number;
      expired?: () => void;
    }
  > = new Map();
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
    const data = await streamToString(req);

    if (!(await verify(req.headers, data, this.publicKey))) {
      res.statusCode = 401;
      return res.end();
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
            const command = this.commands.find(
              (c) => interaction.data.name === c.name
            );

            if (!command) {
              res.statusCode = 400;
              res.end();
              return;
            }

            const handlerContext = new ChatInputInteraction(
              this,
              interaction as APIChatInputApplicationCommandInteraction,
              ({ code, body }) => {
                res.statusCode = code;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify(body));
                return;
              }
            );

            for (const middleware of this.middlewares) {
              const res = await middleware(handlerContext);
              if (!res.next) {
                return;
              }
              handlerContext.context = res.ctx;
            }

            command.handler(handlerContext as any);

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
        if (
          this.components.has(
            `${interaction.message.id}-${interaction.data.custom_id}`
          )
        ) {
          const handlerContext = new MessageComponentInteraction(
            this,
            interaction as APIMessageComponentInteraction,
            ({ code, body }) => {
              res.statusCode = code;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(body));
              return;
            }
          );
          return this.components
            .get(`${interaction.message.id}-${interaction.data.custom_id}`)
            ?.handler(handlerContext);
        }
        return;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        return;
      }
    }
  }

  listen(port: number = 3000, address: string = "localhost") {
    if (process.argv.find((arg) => arg === "push")) {
      import("./cli").then((cli) => cli.loadPush(this));
      return;
    } else if (process.argv.find((arg) => arg === "clear")) {
      import("./cli").then((cli) => cli.loadClear(this));
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

  async clearCommands() {
    await DiscordAPI.put(`/applications/${this.applicationID}/commands`, [], {
      headers: {
        Authorization: `Bot ${this.token}`,
      },
    });
  }

  async clearGuildCommands(guildID: string) {
    await DiscordAPI.put(
      `/applications/${this.applicationID}/guilds/${guildID}/commands`,
      [],
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
export { ActionRow, Button, SelectMenu, Guild, Member, User, Embed };
