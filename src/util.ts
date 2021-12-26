import axios from "axios";
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { Readable } from "stream";
import nacl from "tweetnacl";

export const DiscordAPI = axios.create({
  baseURL: "https://discord.com/api/v9",
  headers: {
    "Content-Type": "application/json",
  },
});

export const streamToString = async (stream: Readable) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
};

export const verify = async (
  headers: IncomingHttpHeaders,
  data: string,
  publicKey: string
) => {
  const signature = headers["x-signature-ed25519"] as string | undefined;
  const timestamp = headers["x-signature-timestamp"] as string | undefined;

  if (!signature || !timestamp) {
    return false;
  }

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + data),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );

  if (!isVerified) {
    return false;
  }

  return true;
};
