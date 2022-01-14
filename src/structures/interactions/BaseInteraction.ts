import {
  APIApplicationCommandInteraction,
  APIChannel,
  APIChatInputApplicationCommandInteraction,
  APIGuild,
  APIMessage,
  APIMessageComponentInteraction,
  InteractionResponseType,
} from "discord-api-types";
import QuartzClient, { Guild, Member, SendOptions, User } from "../../";
import { DiscordAPI } from "../../util";
import MessageComponentInteraction from "./MessageComponent";

class BaseInteraction {
  #respond: ({ code, body }: { code: number; body: object }) => void;
  readonly client: QuartzClient;
  readonly invokedAt: number = Date.now();
  #data: APIApplicationCommandInteraction | APIMessageComponentInteraction;
  messageID?: string;
  user: User;
  member?: Member;
  readonly token?: string;
  readonly guildID?: string;
  readonly channelID: string;
  sent = false;
  deferred = false;

  constructor(
    client: QuartzClient,
    data: APIApplicationCommandInteraction | APIMessageComponentInteraction,
    respond: ({ code, body }: { code: number; body: object }) => void
  ) {
    this.#data = data;
    this.client = client;
    this.#respond = respond;
    this.channelID = data.channel_id;
    this.token = data.token;
    this.guildID = "guild_id" in data ? data.guild_id : undefined;
    this.member =
      "guild_id" in data ? new Member(data.member!, data.guild_id!) : undefined;
    this.user = new User("guild_id" in data ? data.member!.user : data.user!);
  }

  get expired() {
    return this.invokedAt + 1000 * 60 * 15 < Date.now();
  }

  async guild() {
    if (!("guild_id" in this.#data)) return;
    if (!this.#data.guild_id) return;
    const rawGuild = (
      await DiscordAPI.get<APIGuild>(`/guilds/${this.#data.guild_id}`, {
        headers: {
          Authorization: `Bot ${this.client.token}`,
        },
      })
    ).data;
    if (!rawGuild) return;
    return new Guild(rawGuild, this.client.token);
  }

  get locale() {
    return (
      "guild_locale" in this.#data
        ? (this.#data as any)?.guild_locale
        : (this.#data as any).locale
    ) as string;
  }

  async channel() {
    (
      await DiscordAPI.get<APIChannel>(`/channels/${this.#data.channel_id}`, {
        headers: {
          Authorization: `Bot ${this.client.token}`,
        },
      })
    ).data;
  }

  async message(id = "@original") {
    const message = (
      await DiscordAPI.get<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}/messages/${id}`
      )
    ).data;
    if (id === "@original") this.messageID = message.id;
    return message;
  }

  async send({
    allowedMentions,
    ephemeral,
    ...rest
  }: SendOptions & { ephemeral?: boolean }) {
    if (this.expired) throw new Error("Interaction already expired");
    if (!this.sent) {
      this.sent = true;
      this.#respond({
        code: 200,
        body: {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "content" in rest ? rest.content : undefined,
            embeds: "embeds" in rest ? rest.embeds : undefined,
            allowed_mentions: allowedMentions,
            components: "components" in rest ? rest.components : undefined,
            flags: ephemeral ? 1 << 6 : undefined,
          },
        },
      });
    } else if (this.sent && this.deferred) {
      return this.edit({
        allowedMentions,
        ...rest,
      });
    } else {
      return this.sendFollowUp({
        allowedMentions,
        ephemeral,
        ...rest,
      });
    }
  }

  async sendFollowUp({
    allowedMentions,
    ephemeral,
    ...rest
  }: SendOptions & { ephemeral?: boolean }) {
    if (this.expired) throw new Error("Interaction already expired");
    const message = (
      await DiscordAPI.post<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}`,
        {
          content: "content" in rest ? rest.content : undefined,
          embeds: "embeds" in rest ? rest.embeds : undefined,
          allowed_mentions: allowedMentions,
          components: "components" in rest ? rest.components : undefined,
          flags: ephemeral ? 1 << 6 : undefined,
        },
        {
          headers: {
            Authorization: `Bot ${this.client.token}`,
          },
        }
      )
    ).data;
    return message;
  }

  async edit(
    { allowedMentions, ...rest }: SendOptions,
    messageID: string = "@original"
  ) {
    if (messageID === "@original") {
      this.deferred = false;
    }
    if (this.expired) throw new Error("Interaction already expired");
    const message = (
      await DiscordAPI.patch<APIMessage>(
        `/webhooks/${this.client.applicationID}/${this.token}/messages/${messageID}`,
        {
          content: "content" in rest ? rest.content : undefined,
          embeds: "embeds" in rest ? rest.embeds : undefined,
          components: "components" in rest ? rest.components : undefined,
          allowed_mentions: allowedMentions,
        },
        {
          headers: {
            Authorization: `Bot ${this.client.token}`,
          },
        }
      )
    ).data;
    if (messageID === "@original") {
      this.messageID = message.id;
    }
    return message;
  }

  async delete(id = "@original") {
    await DiscordAPI.delete(
      `/webhooks/${this.client.applicationID}/${this.token}/messages/${id}`,
      {
        headers: {
          Authorization: `Bot ${this.client.token}`,
        },
      }
    );
    if (id === "@original") this.messageID = undefined;
  }

  async defer(ephemeral = false) {
    if (!this.sent && !this.deferred) {
      this.sent = true;
      this.deferred = true;
      this.#respond({
        code: 200,
        body: {
          type: InteractionResponseType.DeferredChannelMessageWithSource,
          data: {
            flags: ephemeral ? 1 << 6 : undefined,
          },
        },
      });
    }
  }

  async registerComponent({
    id,
    handler,
    expiration = 1000 * 60 * 15,
    expired,
  }: {
    id: string;
    handler: (ctx: MessageComponentInteraction) => void;
    expiration?: number;
    expired?: () => void;
  }) {
    if (this.expired) throw new Error("Interaction already expired");
    if (!this.sent || this.deferred)
      throw new Error("A message must be sent before registering a component");
    if (!this.messageID) throw new Error("Fetch message first");
    this.client.components.set(`${this.messageID}-${id}`, {
      handler,
      expires: this.invokedAt + expiration,
      expired,
    });
  }

  async unregisterComponent({
    id,
    messageID,
  }: {
    id: string;
    messageID?: string;
  }) {
    if (!messageID) {
      if (!this.messageID) throw new Error("Init message id");
      else messageID = this.messageID;
    }
    return this.client.components.delete(`${messageID}-${id}`);
  }
}

export default BaseInteraction;
