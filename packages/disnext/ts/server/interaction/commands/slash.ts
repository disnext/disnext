import {
  APIChatInputApplicationCommandDMInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuild,
  APIInteractionGuildMember,
  APIMessage,
  APIUser,
  APIVersion,
  InteractionType,
  LocaleString,
  Routes,
} from "discord-api-types/v10";
import {
  APIChatInputApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionData,
} from "discord-api-types/v10";
import fetch from "node-fetch";
import { Ctx } from "../../../utils/http.js";

export class SlashCommand {
  #id: string;
  #application_id: string;
  #type: InteractionType.ApplicationCommand;
  #data: APIChatInputApplicationCommandInteractionData;
  #channel_id: string;
  #token: string;
  #version: 1;
  #message?: APIMessage | undefined;
  #locale: LocaleString;
  #guild_id?: string;
  #user?: APIUser;
  constructor(ctx: Ctx<APIChatInputApplicationCommandInteraction>) {
    this.#id = ctx.interaction.id;
    this.#application_id = ctx.interaction.application_id;
    this.#type = ctx.interaction.type;
    this.#data = ctx.interaction.data;
    this.#channel_id = ctx.interaction.channel_id;
    this.#token = ctx.interaction.token;
    this.#version = ctx.interaction.version;
    this.#message = ctx.interaction.message;
    this.#locale = ctx.interaction.locale;
    this.#user = ctx.interaction.user;
    this.#guild_id = ctx.interaction.guild_id;
  }
}

export class GuildSlashCommand extends SlashCommand {
  #guild_id: string;
  #member: APIInteractionGuildMember;
  #guild_locale?: LocaleString;
  #cached_guild?: APIGuild;

  constructor(ctx: Ctx<APIChatInputApplicationCommandGuildInteraction>) {
    super(ctx);
    this.#guild_id = ctx.interaction.guild_id;
    this.#member = ctx.interaction.member;
    this.#guild_locale = ctx.interaction.guild_locale;
  }

  get guildID() {
    return this.#guild_id;
  }

  get user() {
    return this.#member.user;
  }

  member() {
    return this.#member;
  }

  async guild() {
    if (!this.#cached_guild) {
      const response = await (
        await fetch(Routes.guild(this.#guild_id), {
          headers: {
            Authorization: `Bot ${process.env.DISNEXT_DISCORD_TOKEN}`,
          },
        })
      ).json();
      if (!response) return;
      this.#cached_guild = response as APIGuild;
    }
    return this.#cached_guild;
  }
}
