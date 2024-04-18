import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  ChannelType,
  Colors,
  EmbedBuilder,
  Events,
  GuildChannel,
  PermissionsBitField,
  TextChannel,
  channelMention,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { readableChannelType } from "../functions/readableChannelType";

export class ChannelCreateListener extends Listener<Events.ChannelCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ChannelCreate,
    });
  }
  public async run(channel: GuildChannel) {
    if (channel.isDMBased()) return;
    const logsSchema = await LogsSchema.find(channel.client, channel.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ChannelCreate].toggled) {
      const channelToSend = (await channel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ChannelCreate].channel
      )) as TextChannel;
      const basicTypeString =
        channel.type === ChannelType.GuildCategory ? "Category" : "Channel";
      const auditLogs = await channel.guild.fetchAuditLogs();
      const channelAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ChannelCreate &&
            logs.targetId === channel.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${basicTypeString} created`)
            .setDescription(channelMention(channel.id))
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
                name: `${basicTypeString} type`,
                value: codeBlock(readableChannelType(channel as Channel)),
                inline: true,
              },
              {
                name: `Created by:`,
                value: userMention(channelAuditLog?.executorId!),
                inline: true,
              },
              {
                name: `Created at:`,
                value: time(Math.floor(channel.createdTimestamp / 1000), "F"),
                inline: true,
              },
              {
                name: `Is the ${basicTypeString.toLowerCase()} private?`,
                value: codeBlock(
                  channel
                    .permissionsFor(channel.guild.roles.everyone.id)
                    ?.has(PermissionsBitField.Flags.ViewChannel)
                    ? `${basicTypeString} is not private.`
                    : `${basicTypeString} is private.`
                ),
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    }
  }
}
