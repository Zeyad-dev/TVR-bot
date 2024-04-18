import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  ChannelType,
  Colors,
  EmbedBuilder,
  Events,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { readableChannelType } from "../functions/readableChannelType";

export class ChannelDeleteListener extends Listener<Events.ChannelDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ChannelDelete,
    });
  }
  public async run(channel: Channel) {
    if (channel.isDMBased()) return;
    const logsSchema = await LogsSchema.find(channel.client, channel.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ChannelDelete].toggled) {
      const channelToSend = (await channel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ChannelDelete].channel
      )) as TextChannel;
      const basicTypeString =
        channel.type === ChannelType.GuildCategory ? "Category" : "Channel";
      const auditLogs = await channel.guild.fetchAuditLogs();
      const channelAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ChannelDelete &&
            logs.targetId === channel.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${basicTypeString} deleted`)
            .setFields([
              {
                name: `${basicTypeString} Name:`,
                value: codeBlock(channel.name),
                inline: true,
              },
              {
                name: `${basicTypeString} Id:`,
                value: codeBlock(channel.id),
                inline: true,
              },
              {
                name: `${basicTypeString} type:`,
                value: codeBlock(readableChannelType(channel as Channel)),
                inline: true,
              },
              {
                name: `Deleted by:`,
                value: userMention(channelAuditLog?.executorId!),
                inline: true,
              },
              {
                name: `Deleted at:`,
                value: time(
                  Math.floor(channelAuditLog?.createdTimestamp! / 1000),
                  "F"
                ),
                inline: true,
              },
            ])
            .setColor(Colors.Red),
        ],
      });
    }
  }
}
