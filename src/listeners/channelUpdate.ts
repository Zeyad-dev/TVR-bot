import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  ChannelType,
  Colors,
  EmbedBuilder,
  Events,
  TextChannel,
  ThreadAutoArchiveDuration,
  channelMention,
  codeBlock,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { readableChannelType } from "../functions/readableChannelType";
import { millisecondsToReadableTime } from "../functions/MStoTime";
import { camelCaseToWords } from "../functions/camelCaseToWords";

export class ChannelUpdateListener extends Listener<Events.ChannelUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ChannelUpdate,
    });
  }
  public async run(oldChannel: Channel, newChannel: Channel) {
    if (oldChannel.isDMBased() || newChannel.isDMBased()) return;
    const logsSchema = await LogsSchema.find(
      newChannel.client,
      newChannel.guild.id
    );
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ChannelUpdate].toggled) {
      const channelToSend = (await newChannel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ChannelUpdate].channel
      )) as TextChannel;
      const basicTypeString =
        newChannel.type === ChannelType.GuildCategory ? "Category" : "Channel";
      const auditLogs = await newChannel.guild.fetchAuditLogs();
      const channelAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ChannelUpdate &&
            logs.targetId === oldChannel.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const typeChange = channelAuditLog?.changes.find(
        (change) => change.key === "type"
      );
      const autoArchiveChange = channelAuditLog?.changes.find(
        (change) => change.key === "default_auto_archive_duration"
      );
      const topicChange = channelAuditLog?.changes.find(
        (change) => change.key === "topic"
      );
      const nameChange = channelAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const nsfwChange = channelAuditLog?.changes.find(
        (change) => change.key === "nsfw"
      );
      const rateLimitChange = channelAuditLog?.changes.find(
        (change) => change.key === "rate_limit_per_user"
      );
      const embed = new EmbedBuilder()
        .setTitle(`${basicTypeString} updated`)
        .addFields([
          {
            name: `${basicTypeString}:`,
            value: channelMention(newChannel.id),
            inline: true,
          },
          {
            name: `Updated by:`,
            value: userMention(channelAuditLog?.executorId!),
            inline: true,
          },
        ])
        .setColor(Colors.Blue);
      if (typeChange)
        embed.addFields([
          {
            name: "Type:",
            value: codeBlock(
              "diff",
              `-${readableChannelType(oldChannel)}\n+${readableChannelType(
                newChannel
              )}`
            ),
          },
        ]);
      if (autoArchiveChange)
        embed.addFields([
          {
            name: "Default Auto Archive duration:",
            value: codeBlock(
              "diff",
              `-${
                (oldChannel as TextChannel).defaultAutoArchiveDuration
                  ? camelCaseToWords(
                      ThreadAutoArchiveDuration[autoArchiveChange.old as number]
                    )
                  : "None"
              }\n+${
                (newChannel as TextChannel).defaultAutoArchiveDuration
                  ? camelCaseToWords(
                      ThreadAutoArchiveDuration[autoArchiveChange.new as number]
                    )
                  : "None"
              }`
            ),
            inline: true,
          },
        ]);
      if (topicChange)
        embed.addFields([
          {
            name: "Topic:",
            value: codeBlock(
              "diff",
              `-${topicChange.old || "No topic"}\n+${
                topicChange.new || "No topic"
              }`
            ),
          },
        ]);
      if (nameChange) {
        if (nameChange.new === nameChange.old) return;
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock(
              "diff",
              `-${oldChannel.name}\n+${newChannel.name}`
            ),
          },
        ]);
      }
      if (nsfwChange)
        embed.addFields([
          {
            name: "NSFW:",
            value: codeBlock(
              "diff",
              `-${(oldChannel as TextChannel).nsfw}\n+${
                (newChannel as TextChannel).nsfw
              }`
            ),
          },
        ]);
      if (rateLimitChange)
        embed.addFields([
          {
            name: "Slowmode:",
            value: codeBlock(
              "diff",
              `-${millisecondsToReadableTime(
                rateLimitChange.old as number
              )}\n+${millisecondsToReadableTime(rateLimitChange.new as number)}`
            ),
          },
        ]);
      if (embed.data.fields?.length! <= 2) return;
      channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
