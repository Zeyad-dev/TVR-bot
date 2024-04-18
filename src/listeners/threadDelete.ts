import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  TextChannel,
  ThreadChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class ThreadDeleteListener extends Listener<Events.ThreadDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ThreadDelete,
    });
  }
  public async run(thread: ThreadChannel) {
    const logsSchema = await LogsSchema.find(thread.client, thread.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ThreadDelete].toggled) {
      const channelToSend = (await thread.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ThreadDelete].channel
      )) as TextChannel;
      const auditLogs = await thread.guild.fetchAuditLogs();
      const threadAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ThreadDelete &&
            logs.targetId === thread.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Thread deleted`)
            .setFields([
              {
                name: `Thread Name:`,
                value: codeBlock(thread.name),
                inline: true,
              },
              {
                name: `Thread Id:`,
                value: codeBlock(thread.id),
                inline: true,
              },
              {
                name: `Deleted by:`,
                value: `${userMention(threadAuditLog?.executorId!)} (${
                  threadAuditLog?.executor?.username
                })`,
                inline: true,
              },
              {
                name: `Deleted at:`,
                value: time(
                  Math.floor(threadAuditLog!.createdTimestamp / 1000),
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
