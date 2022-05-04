import {
  APIInteraction,
  APIApplicationCommandInteraction,
  InteractionType,
  APIMessageComponentInteraction,
  APIApplicationCommandAutocompleteInteraction,
  APIModalSubmitInteraction,
  APIPingInteraction,
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandType,
  APIMessageApplicationCommandInteraction,
  APIChatInputApplicationCommandGuildInteraction,
} from "discord-api-types/v10";
import { ServerResponse } from "node:http";
import { IncomingMessage } from "node:http";
import { Ctx, parseCtx } from "../../utils/http.js";
import { verify } from "../../utils/verify.js";
import commands from "../commands/index.js";
import { GuildSlashCommand, SlashCommand } from "./commands/slash.js";

const isApplicationCommand = (
  ctx: Ctx<APIInteraction>
): ctx is Ctx<APIApplicationCommandInteraction> =>
  ctx.interaction.type === InteractionType.ApplicationCommand;

const isGuildApplicationCommand = (
  ctx: Ctx<APIChatInputApplicationCommandInteraction>
): ctx is Ctx<APIChatInputApplicationCommandGuildInteraction> =>
  !!ctx.interaction.data.guild_id;

const isMessageComponent = (
  ctx: Ctx<APIInteraction>
): ctx is Ctx<APIMessageComponentInteraction> =>
  ctx.interaction.type === InteractionType.MessageComponent;

const isApplicationCommandAutocomplete = (
  ctx: Ctx<APIInteraction>
): ctx is Ctx<APIApplicationCommandAutocompleteInteraction> =>
  ctx.interaction.type === InteractionType.ApplicationCommandAutocomplete;

const isModalSubmit = (
  ctx: Ctx<APIInteraction>
): ctx is Ctx<APIModalSubmitInteraction> =>
  ctx.interaction.type === InteractionType.ModalSubmit;

const isPing = (ctx: Ctx<any>): ctx is Ctx<APIPingInteraction> =>
  ctx.interaction.type === InteractionType.Ping;

const isApplicationCommandChatInput = (
  ctx: Ctx<APIApplicationCommandInteraction>
): ctx is Ctx<APIChatInputApplicationCommandInteraction> =>
  ctx.interaction.data.type === ApplicationCommandType.ChatInput;

const isApplicationCommandMessage = (
  ctx: Ctx<APIApplicationCommandInteraction>
): ctx is Ctx<APIMessageApplicationCommandInteraction> =>
  ctx.interaction.data.type === ApplicationCommandType.Message;

const isApplicationCommandUser = (
  ctx: Ctx<APIApplicationCommandInteraction>
): ctx is Ctx<APIMessageApplicationCommandInteraction> =>
  ctx.interaction.data.type === ApplicationCommandType.User;

const handleInteractions = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  // generate ctx
  const ctx = await parseCtx(req, res);

  // verify signature
  if (
    !(await verify(
      req.headers,
      ctx.data,
      process.env.QUARTZ_DISCORD_PUBLIC_KEY!
    ))
  ) {
    return ctx.reply(
      {
        error: "Invalid signature",
      },
      401
    );
  }

  // handle ping
  if (isPing(ctx)) {
    return ctx.reply({});
  }

  // handle application command
  if (isApplicationCommand(ctx)) {
    if (isApplicationCommandChatInput(ctx)) {
      const command = commands.get(ctx.interaction.data.name);

      if (!command) {
        return ctx.reply(
          {
            error: "Command not found",
          },
          404
        );
      }

      if (
        typeof command.permissions?.dm === "boolean" &&
        command.permissions.dm === false &&
        !!isGuildApplicationCommand(ctx)
      ) {
        const resContext = new GuildSlashCommand(ctx);
        return command.run(resContext);
      } else {
        const resContext = new SlashCommand(ctx);
        return command.run(resContext);
      }
    }
    if (isApplicationCommandMessage(ctx)) {
      return ctx.reply({});
    }
    if (isApplicationCommandUser(ctx)) {
      return ctx.reply({});
    }
  }

  // handle message component
  if (isMessageComponent(ctx)) {
    return ctx.reply({});
  }

  // handle autocomplete
  if (isApplicationCommandAutocomplete(ctx)) {
    return ctx.reply({});
  }

  // handle unknown
  return ctx.reply({
    error: "Unknown interaction",
  });
};

export default handleInteractions;
