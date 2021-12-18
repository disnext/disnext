import http, { IncomingMessage, ServerResponse } from "http";
import nacl from "tweetnacl";
import { Readable } from "stream";
import { Command, CommandOption } from "./commands";
import {
  APIPingInteraction,
  APIApplicationCommandInteraction,
  APIMessageComponentInteraction,
  InteractionType,
} from "discord-api-types";

import { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";

const streamToString = async (stream: Readable) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
};

class QuartzClient {
  private applicationID: string;
  private publicKey: string;
  private token: string;
  private commands: Command<any>[] = [];

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
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
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
        res.end(JSON.stringify({ type: InteractionType.Ping }));
        return;
      }

      case InteractionType.ApplicationCommand: {
        const command = this.commands.find(
          (c) => interaction.data.name === c.name
        );

        if (!command) {
          res.statusCode = 400;
          res.end();
          return;
        }

        command?.handler({ options: (interaction.data as any).options });
        return;
      }

      case InteractionType.MessageComponent: {
        return;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        return;
      }
    }
  }

  listen(port: number, address: string) {
    http.createServer(this.handle).listen(port, address);
  }

  //   middleware({}) {
  //
  //   }

  command<T extends Record<string, CommandOption<boolean>> | undefined>(
    options: Command<T>
  ) {
    this.commands.push(options);
  }
}

export default QuartzClient;

// PORT
// DISCORD TOKEN
// DISCORD APPLICATION ID
// DISCORD PUBLIC KEY
