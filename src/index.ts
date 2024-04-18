import process from "node:process";
import { SapphireClient } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
  Snowflake,
  TextChannel,
  codeBlock,
} from "discord.js";
import { camelCaseToWords } from "./functions/camelCaseToWords";

const intents = [
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildWebhooks,
];

const client = new SapphireClient<true>({
  intents,
  partials: [Partials.Message, Partials.Channel],
});

client.login(process.env.DISCORD_TOKEN).then(async () => {
  await client.channels.fetch("1229068353264685116", {
    cache: true,
  });
});

export const bans: { [key: Snowflake]: Snowflake[] } = {};
export const unbans: { [key: Snowflake]: Snowflake[] } = {};
export const kicks: { [key: Snowflake]: Snowflake[] } = {};
export const purges: {
  [key: Snowflake]: {
    channel: Snowflake;
    messages: Snowflake[];
  }[];
} = {};
process.on("exit", async (code) => {
  await handleErrors("exit", null, code);
});
process.on("uncaughtException", async (error) => {
  await handleErrors("uncaughtException", error, null);
});
process.on("unhandledRejection", async (error) => {
  await handleErrors("unhandledRejection", error as Error, null);
});
process.on("uncaughtExceptionMonitor", async (error) => {
  await handleErrors("uncaughtExceptionMonitor", error, null);
});

async function handleErrors(
  type: string,
  error: Error | null,
  code: number | null
) {
  (client.channels.cache.get("1229068353264685116")! as TextChannel)
    .send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${camelCaseToWords(type)}`)
          .setDescription(
            code
              ? `**Exit code:** \`${code}\``
              : `**Error name:** ${codeBlock(error!.name)}`
          )
          .setColor(Colors.Red),
        new EmbedBuilder()
          .setDescription(`**Error message:** ${codeBlock(error!.message)}`)
          .setColor(Colors.Red),
        new EmbedBuilder()
          .setDescription(
            `${
              error!.stack
                ? `\n\n**Error stack:** ${codeBlock(error!.stack!)}`
                : "**No stack!**"
            }`
          )
          .setColor(Colors.Red),
      ],
    })
    .catch((err) => console.log(err));
}
