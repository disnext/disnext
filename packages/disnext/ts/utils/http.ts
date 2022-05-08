import { APIInteraction } from "discord-api-types/v10";
import { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

export const streamToString = async (stream: Readable) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
};

export interface Ctx<I = APIInteraction> {
  data: string;
  interaction: I;
  reply: <T>(data?: T, code?: number) => ServerResponse | undefined;
}

export const parseCtx = async (req: IncomingMessage, res: ServerResponse) => {
  const data = await streamToString(req);

  const interaction = JSON.parse(data) as APIInteraction;

  return {
    data,
    interaction,
    reply: <T>(data?: T, code?: number) => {
      res.statusCode = code || 200;
      if (data) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      } else return res.end();
    },
  };
};
