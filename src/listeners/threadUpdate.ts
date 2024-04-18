import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  TextChannel,
  ThreadAutoArchiveDuration,
  ThreadChannel,
  channelMention,
  codeBlock,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { millisecondsToReadableTime } from "../functions/MStoTime";
import { camelCaseToWords } from "../functions/camelCaseToWords";

export class ThreadUpdateListener extends Listener<Events.ThreadUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ThreadUpdate,
    });
  }
  public async run(oldThread: ThreadChannel, newThread: ThreadChannel) {
    if (oldThread.isDMBased() || newThread.isDMBased()) return;
    const logsSchema = await LogsSchema.find(
      newThread.client,
      newThread.guild.id
    );
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ThreadUpdate].toggled) {
      const channelToSend = (await newThread.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ThreadUpdate].channel
      )) as TextChannel;
      const auditLogs = await newThread.guild.fetchAuditLogs();
      const channelAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ThreadUpdate &&
            logs.targetId === oldThread.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const autoArchiveChange = channelAuditLog?.changes.find(
        (change) => change.key === "auto_archive_duration"
      );
      const nameChange = channelAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const rateLimitChange = channelAuditLog?.changes.find(
        (change) => change.key === "rate_limit_per_user"
      );
      const embed = new EmbedBuilder()
        .setTitle(`Thread updated`)
        .addFields([
          {
            name: `Thread:`,
            value: channelMention(newThread.id),
            inline: true,
          },
          {
            name: `Updated by:`,
            value: userMention(channelAuditLog?.executorId!),
            inline: true,
          },
        ])
        .setColor(Colors.Blue);
      if (autoArchiveChange)
        embed.addFields([
          {
            name: "Default Auto Archive duration:",
            value: codeBlock(
              "diff",
              `-${
                autoArchiveChange.old
                  ? camelCaseToWords(
                      ThreadAutoArchiveDuration[autoArchiveChange.old as number]
                    )
                  : "None"
              }\n+${
                autoArchiveChange.new
                  ? camelCaseToWords(
                      ThreadAutoArchiveDuration[autoArchiveChange.new as number]
                    )
                  : "None"
              }`
            ),
            inline: true,
          },
        ]);
      if (nameChange) {
        if (nameChange.new === nameChange.old) return;
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${oldThread.name}\n+${newThread.name}`),
          },
        ]);
      }
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
