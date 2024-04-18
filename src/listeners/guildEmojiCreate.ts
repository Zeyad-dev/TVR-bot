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

export class GuildEmojiCreateListener extends Listener<Events.GuildEmojiCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildEmojiCreate,
    });
  }
  public async run(emoji: Emoji) {
    if (emoji instanceof GuildEmoji === false) return;
    const logsSchema = await LogsSchema.find(emoji.client, emoji.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildEmojiCreate].toggled
    ) {
      const channelToSend = (await emoji.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildEmojiCreate].channel
      )) as TextChannel;
      const auditLogs = await emoji.guild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.EmojiCreate &&
            logs.targetId === emoji.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Emoji created")
            .setFields([
              {
                name: "Emoji name:",
                value: codeBlock(`${emoji.name} (${emoji.id})`),
              },
              {
                name: "Added by:",
                value: userMention(emojiAuditLog?.executorId!),
              },
              {
                name: "Added at:",
                value: time(Math.floor(emoji.createdTimestamp! / 1000), "F"),
              },
            ])
            .setThumbnail(emoji.imageURL())
            .setColor(Colors.Green),
        ],
      });
    }
  }
}
