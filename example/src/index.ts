import "dotenv/config";
import QuartzClient, { ActionRow, Button, options } from "@points.city/quartz";

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
    await ctx.defer(true);
    const guild = await ctx.guild();
    await ctx.send({
      content: `Ponging ${guild?.name}`,
      components: [
        new ActionRow().addButton(
          new Button().setID("test").setLabel("test button")
        ),
      ],
    });
    await ctx.registerComponent({
      id: "test",
      handler: (btnCtx) => {
        btnCtx.editParent({
          content: "lmao",
          components: [],
        });
      },
    });
  },
});

client.listen(3003);
