import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Message,
  Snowflake,
  TextChannel,
  channelMention,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { purges } from "..";

export class MessageBulkDeleteListener extends Listener<Events.MessageBulkDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.MessageBulkDelete,
    });
  }
  public async run(messages: Collection<Snowflake, Message>, channel: Channel) {
    if (channel.isDMBased()) return;
    const logsSchema = await LogsSchema.find(channel.client, channel.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.MessageBulkDelete].toggled
    ) {
      const channelToSend = (await channel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.MessageBulkDelete].channel
      )) as TextChannel;
      const auditLogs = await channel.guild.fetchAuditLogs();
      const messageAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.MessageBulkDelete &&
            // @ts-expect-error
            logs.target.id === channel.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const checkPurge = Object.values(purges).find((str) =>
        str.find(
          (v) => v.channel === channel.id && v.messages.length === messages.size
        )
      );
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Messages Bulk Deleted")
            .setFields([
              {
                name: "Amount of messages:",
                value: codeBlock(`${messages.size}`),
                inline: true,
              },
              {
                name: "Messages deleted by:",
                value: checkPurge
                  ? userMention(
                      Object.keys(purges)[
                        Object.values(purges).findIndex((str) =>
                          str.find(
                            (v) =>
                              v.channel === channel.id &&
                              v.messages.length === messages.size
                          )
                        )
                      ]
                    )
                  : userMention(messageAuditLog?.executorId!),
                inline: true,
              },
              {
                name: "Messages deleted in channel:",
                value: channelMention(channel.id),
                inline: true,
              },
              {
                name: "Messages deleted at:",
                value: time(
                  Math.floor(messageAuditLog?.createdTimestamp! / 1000),
                  "F"
                ),
                inline: true,
              },
            ])
            .setColor(Colors.Red),
        ],
      });
      if (
        Object.values(purges).find((str) =>
          str.includes({
            channel: channel.id,
            messages: messages.map((m) => m.id),
          })
        )
      ) {
        const index = Object.values(purges).findIndex((str) =>
          str.includes({
            channel: channel.id,
            messages: messages.map((m) => m.id),
          })
        );
        purges[Object.keys(purges)[index]].splice(index, 1);
      }
    }
  }
}
