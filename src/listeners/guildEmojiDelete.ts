import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Emoji,
  Events,
  GuildEmoji,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class GuildEmojiDeleteListener extends Listener<Events.GuildEmojiDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildEmojiDelete,
    });
  }
  public async run(emoji: Emoji) {
    if (emoji instanceof GuildEmoji === false) return;
    const logsSchema = await LogsSchema.find(emoji.client, emoji.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildEmojiDelete].toggled
    ) {
      const channelToSend = (await emoji.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildEmojiDelete].channel
      )) as TextChannel;
      const auditLogs = await emoji.guild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.EmojiDelete &&
            logs.targetId === emoji.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Emoji removed")
            .setFields([
              {
                name: "Emoji name:",
                value: codeBlock(`${emoji.name} (${emoji.id})`),
              },
              {
                name: "Removed by:",
                value: userMention(emojiAuditLog?.executorId!),
              },
              {
                name: "Removed at:",
                value: time(
                  Math.floor(emojiAuditLog?.createdTimestamp! / 1000),
                  "F"
                ),
              },
            ])
            .setThumbnail(emoji.imageURL())
            .setColor(Colors.Red),
        ],
      });
    }
  }
}
