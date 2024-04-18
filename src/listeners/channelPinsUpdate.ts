import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  Colors,
  EmbedBuilder,
  Events,
  TextChannel,
  channelMention,
  userMention,
  time,
  codeBlock,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class ChannelPinsCreateListener extends Listener<Events.ChannelPinsUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ChannelPinsUpdate,
    });
  }
  public async run(channel: Channel) {
    if (channel.isDMBased() || !channel.isTextBased()) return;
    const logsSchema = await LogsSchema.find(channel.client, channel.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.ChannelPinsUpdate].toggled
    ) {
      const channelToSend = (await channel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ChannelPinsUpdate].channel
      )) as TextChannel;
      const auditLogs = await channel.guild.fetchAuditLogs();
      const pinsAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            (logs.action === AuditLogEvent.MessagePin ||
              logs.action === AuditLogEvent.MessageUnpin) &&
            // @ts-expect-error
            logs.extra.channel.id === channel.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const message = await channel.messages.fetch(
        // @ts-expect-error
        pinsAuditLog?.extra.messageId
      );
      const embed = new EmbedBuilder().addFields([
        {
          name: "Message's channel:",
          value: channelMention(channel.id),
          inline: true,
        },
        {
          name: "Message link:",
          value: message.url,
          inline: true,
        },

        {
          name: "Message sent by:",
          value: userMention(message.author.id),
          inline: true,
        },
        {
          name: "Message Content:",
          value:
            message.content?.length > 1
              ? codeBlock(message.content)
              : codeBlock("diff", "-Message content is an embed"),
          inline: true,
        },
      ]);
      if (pinsAuditLog?.action === AuditLogEvent.MessagePin) {
        embed.setTitle("Message pinned");
        embed.addFields([
          {
            name: "Pinned by:",
            value: userMention(pinsAuditLog.executorId!),
            inline: true,
          },
          {
            name: "Pinned at:",
            value: time(Math.floor(pinsAuditLog.createdTimestamp / 1000), "F"),
            inline: true,
          },
        ]);
        embed.setColor(Colors.Green);
      } else if (pinsAuditLog?.action === AuditLogEvent.MessageUnpin) {
        embed.setTitle("Message unpinned");
        embed.addFields([
          {
            name: "Unpinned by:",
            value: userMention(pinsAuditLog.executorId!),
            inline: true,
          },
          {
            name: "Unpinned at:",
            value: time(Math.floor(pinsAuditLog.createdTimestamp / 1000), "F"),
            inline: true,
          },
        ]);
        embed.setColor(Colors.Red);
      }
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
