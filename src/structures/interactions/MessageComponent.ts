import {
  APIMessage,
  APIMessageComponentInteraction,
  ComponentType,
  InteractionResponseType,
} from "discord-api-types";
import QuartzClient, { SendOptions } from "../../";
import BaseInteraction from "./BaseInteraction";

class MessageComponentInteraction extends BaseInteraction {
  customID: string;
  componentType: ComponentType;
  _message: APIMessage;
  #respond: ({ code, body }: { code: number; body: object }) => void;
  constructor(
    client: QuartzClient,
    data: APIMessageComponentInteraction,
    respond: ({ code, body }: { code: number; body: object }) => void
  ) {
    super(client, data, respond);
    this.customID = data.data.custom_id;
    this.componentType = data.data.component_type;
    this._message = data.message;
    this.#respond = respond;
  }

  async ack() {
    if (!this.sent) {
      this.sent = true;
      await this.#respond({
        code: 200,
        body: {
          type: InteractionResponseType.DeferredMessageUpdate,
        },
      });
    }
  }

  async editParent({ allowedMentions, ...rest }: SendOptions) {
    if (this.expired) throw new Error("Interaction already expired");

    if (!this.sent) {
      await this.#respond({
        code: 200,
        body: {
          type: InteractionResponseType.UpdateMessage,
          data: {
            content: "content" in rest ? rest.content : undefined,
            embeds: "embeds" in rest ? rest.embeds : undefined,
            components: "components" in rest ? rest.components : undefined,
            allowed_mentions: allowedMentions,
          },
        },
      });
      return;
    } else {
      await this.edit(rest, this._message.id);
      return;
    }
  }
}

export default MessageComponentInteraction;
