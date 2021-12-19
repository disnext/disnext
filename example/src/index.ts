import "dotenv/config";
import { options } from "../../src/commands";
import QuartzClient, { inferMiddlewareContextTypes } from "../../src/index";

const client: QuartzClient = new QuartzClient({
  applicationID: process.env.DISCORD_APPLICATION_ID!,
  publicKey: process.env.DISCORD_PUBLIC_KEY!,
  token: process.env.DISCORD_TOKEN!,
});

client.middleware(async (ctx) => {
  return {
    next: true,
    ctx: { owo: true },
  };
});

client.command({
  name: "ping",
  description: "Sends a ping response",
  options: {
    foo: options.string({
      description: "bar",
    }),
    user: options.user({
      description: "user to pong",
    }),
  },
  handler: async (ctx) => {
    const guild = await ctx.guild();
    ctx.send({ content: `Ponging ${guild?.name}` });
  },
});

client.listen(3003);
