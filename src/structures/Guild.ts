import {
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIUser,
} from "discord-api-types";
import { DiscordAPI } from "../util";

class Members {
  #guildID: string;
  constructor(guildID: string) {
    this.#guildID = guildID;
  }

  async get(id: string) {
    await DiscordAPI.get<APIGuildMember>(
      `/guilds/${this.#guildID}/members/${id}`
    );
  }

  async ban(
    id: string,
    {
      reason,
      deleteMessageDays,
    }: {
      reason?: string;
      deleteMessageDays?: number;
    }
  ) {
    let body: {
      delete_message_days?: number;
    } = {};

    if (typeof deleteMessageDays === "number")
      body.delete_message_days = deleteMessageDays;

    await DiscordAPI.put(`/guilds/${this.#guildID}/bans/${id}`, body, {
      headers: reason
        ? {
            "X-Audit-Log-Reason": reason,
          }
        : {},
    });
  }

  async unban(id: string, reason?: string) {
    await DiscordAPI.delete(`/guilds/${this.#guildID}/bans/${id}`, {
      headers: reason
        ? {
            "X-Audit-Log-Reason": reason,
          }
        : {},
    });
  }
}
class Guild {
  #members: Members;
  #guild: APIGuild;
  #token: string;
  constructor(guild: APIGuild, token: string) {
    this.#guild = guild;
    this.#token = token;
    this.#members = new Members(guild.id);
  }

  get id() {
    return this.#guild.id;
  }

  get name() {
    return this.#guild.name;
  }

  get icon() {
    return this.#guild.icon;
  }

  get iconHash() {
    return this.#guild.icon_hash;
  }

  get ownerID() {
    return this.#guild.owner_id;
  }

  get members() {
    return this.#members;
  }

  async owner() {
    return (
      await DiscordAPI.get<APIUser>(`/users/${this.ownerID}`, {
        headers: {
          Authorization: `Bot ${this.#token}`,
        },
      })
    ).data;
  }

  get permissions() {
    return this.#guild.permissions;
  }

  get emojis() {
    return this.#guild.emojis;
  }

  get features() {
    return this.#guild.features;
  }

  get mfaLevel() {
    return this.#guild.mfa_level;
  }

  get afkChannelID() {
    return this.#guild.afk_channel_id;
  }

  async afkChannel() {
    if (!this.afkChannelID) return undefined;
    return (
      await DiscordAPI.get<APIChannel>(`/channels/${this.afkChannelID}`, {
        headers: {
          Authorization: `Bot ${this.#token}`,
        },
      })
    ).data;
  }

  get widgetChannelID() {
    return this.#guild.widget_channel_id;
  }

  get widgetEnabled() {
    return this.#guild.widget_enabled;
  }

  async widgetChannel() {
    if (!this.widgetChannelID) return undefined;
    return (
      await DiscordAPI.get<APIChannel>(`/channels/${this.widgetChannelID}`, {
        headers: {
          Authorization: `Bot ${this.#token}`,
        },
      })
    ).data;
  }

  get systemChannelID() {
    return this.#guild.system_channel_id;
  }

  get systemChannelFlags() {
    return this.#guild.system_channel_flags;
  }

  async systemChannel() {
    if (!this.systemChannelID) return undefined;
    return (
      await DiscordAPI.get<APIChannel>(`/channels/${this.systemChannelID}`, {
        headers: {
          Authorization: `Bot ${this.#token}`,
        },
      })
    ).data;
  }

  get rulesChannelID() {
    return this.#guild.rules_channel_id;
  }

  async rulesChannel() {
    if (!this.rulesChannelID) return undefined;
    return (
      await DiscordAPI.get<APIChannel>(`/channels/${this.rulesChannelID}`, {
        headers: {
          Authorization: `Bot ${this.#token}`,
        },
      })
    ).data;
  }

  get defaultMessageNotifications() {
    return this.#guild.default_message_notifications;
  }

  get explicitContentFilter() {
    return this.#guild.explicit_content_filter;
  }

  get roles() {
    return this.#guild.roles;
  }

  get maxPresences() {
    return this.#guild.max_presences;
  }

  get maxMembers() {
    return this.#guild.max_members;
  }

  get description() {
    return this.#guild.description;
  }

  get vanityURLCode() {
    return this.#guild.vanity_url_code;
  }

  get banner() {
    return this.#guild.banner;
  }

  get premiumTier() {
    return this.#guild.premium_tier;
  }

  get premiumSubscriptionCount() {
    return this.#guild.premium_subscription_count;
  }

  get premiumProgressBarEnabled() {
    return this.#guild.premium_progress_bar_enabled;
  }

  get preferredLocale() {
    return this.#guild.preferred_locale;
  }

  get publicUpdatesChannelID() {
    return this.#guild.public_updates_channel_id;
  }

  async publicUpdatesChannel() {
    if (!this.publicUpdatesChannelID) return undefined;
    return (
      await DiscordAPI.get<APIChannel>(
        `/channels/${this.publicUpdatesChannelID}`,
        {
          headers: {
            Authorization: `Bot ${this.#token}`,
          },
        }
      )
    ).data;
  }

  get nsfwLevel() {
    return this.#guild.nsfw_level;
  }

  get stickers() {
    return this.#guild.stickers;
  }
}

export default Guild;
