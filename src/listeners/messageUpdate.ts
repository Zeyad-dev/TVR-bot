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

export class MessageUpdateListener extends Listener<Events.MessageUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.MessageUpdate,
    });
  }
  public async run(oldMessage: Message, newMessage: Message) {
    if (!newMessage.guild) return;
    if (newMessage.partial || oldMessage.partial) return;
    if (newMessage.author.bot) return;
    const logsSchema = await LogsSchema.find(
      newMessage.client,
      newMessage.guild.id
    );
    if (logsSchema && logsSchema.raw.logs[EventsEnum.MessageUpdate].toggled) {
      const channelToSend = (await newMessage.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.MessageUpdate].channel
      )) as TextChannel;
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Message Edited")
            .setFields([
              {
                name: "Message sent by:",
                value: userMention(newMessage.author.id),
                inline: true,
              },
              {
                name: "Message sent in channel:",
                value: channelMention(newMessage.channel.id),
                inline: true,
              },
              {
                name: "Content:",
                value: codeBlock(
                  "diff",
                  `-${
                    oldMessage.content.length < 1
                      ? "Content was an embed"
                      : oldMessage.content
                  }\n+${
                    newMessage.content.length < 1
                      ? "Content is an embed"
                      : newMessage.content
                  }`
                ),
              },
            ])
            .setColor(Colors.Blue),
        ],
      });
    }
  }
}
