import axios from "axios";
import { Readable } from "stream";

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
