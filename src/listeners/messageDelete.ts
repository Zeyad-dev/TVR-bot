import { Listener } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  Events,
  Message,
  TextChannel,
  channelMention,
  codeBlock,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class MessageDeleteListener extends Listener<Events.MessageDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.MessageDelete,
    });
  }
  public async run(message: Message) {
    if (!message.guild) return;
    if (message.partial) return;
    if (message.author.bot) return;
    const logsSchema = await LogsSchema.find(message.client, message.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.MessageDelete].toggled) {
      const channelToSend = (await message.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.MessageDelete].channel
      )) as TextChannel;
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Message Deleted")
            .setFields([
              {
                name: "Message content:",
                value:
                  message.content?.length > 1
                    ? codeBlock(message.content.replaceAll("`", ""))
                    : codeBlock("diff", "-Message content was an embed"),
                inline: true,
              },
              {
                name: "Message ID:",
                value: codeBlock(message.id),
                inline: true,
              },
              {
                name: "Message sent by:",
                value: userMention(message.author.id),
                inline: true,
              },
              {
                name: "Message sent in channel:",
                value: channelMention(message.channelId),
                inline: true,
              },
            ])
            .setColor(Colors.Red),
        ],
      });
    }
  }
}
