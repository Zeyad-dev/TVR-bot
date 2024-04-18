import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  PermissionsBitField,
  TextChannel,
  ThreadChannel,
  channelMention,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class ThreadCreateListener extends Listener<Events.ThreadCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.ThreadCreate,
    });
  }
  public async run(thread: ThreadChannel) {
    const logsSchema = await LogsSchema.find(thread.client, thread.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.ThreadCreate].toggled) {
      const channelToSend = (await thread.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.ThreadCreate].channel
      )) as TextChannel;
      const auditLogs = await thread.guild.fetchAuditLogs();
      const threadAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.ThreadCreate &&
            logs.targetId === thread.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Thread created`)
            .setDescription(channelMention(thread.id))
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
                name: `Created by:`,
                value: `${userMention(threadAuditLog?.executorId!)} (${
                  threadAuditLog?.executor?.username
                })`,
                inline: true,
              },
              {
                name: `Created at:`,
                value: time(
                  Math.floor(threadAuditLog!.createdTimestamp / 1000),
                  "F"
                ),
                inline: true,
              },
              {
                name: `Is the thread private?`,
                value: codeBlock(
                  thread
                    .permissionsFor(thread.guild.roles.everyone.id)
                    ?.has(PermissionsBitField.Flags.ViewChannel)
                    ? `Thread is not private.`
                    : `Thread is private.`
                ),
                inline: true,
              },
              {
                name: "Starter message:",
                value:
                  (await thread.fetchStarterMessage())!.content?.length > 1
                    ? codeBlock((await thread.fetchStarterMessage())!.content)
                    : codeBlock("diff", "-Message content is an embed"),
                inline: true,
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    }
  }
}
