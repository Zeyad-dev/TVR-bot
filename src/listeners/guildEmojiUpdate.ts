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

export class GuildEmojiUpdateListener extends Listener<Events.GuildEmojiUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildEmojiUpdate,
    });
  }
  public async run(emoji: Emoji) {
    if (emoji instanceof GuildEmoji === false) return;
    const logsSchema = await LogsSchema.find(emoji.client, emoji.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildEmojiUpdate].toggled
    ) {
      const channelToSend = (await emoji.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildEmojiUpdate].channel
      )) as TextChannel;
      const auditLogs = await emoji.guild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.EmojiUpdate &&
            logs.targetId === emoji.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const nameChange = emojiAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const embed = new EmbedBuilder()
        .setTitle("Emoji updated")
        .addFields([
          {
            name: "Emoji name:",
            value: codeBlock(nameChange?.old as string),
          },
          {
            name: "Updated by:",
            value: userMention(emojiAuditLog?.executorId!),
          },
          {
            name: "Updated at:",
            value: time(
              Math.floor(emojiAuditLog?.createdTimestamp! / 1000),
              "F"
            ),
          },
        ])
        .setThumbnail(emoji.imageURL())
        .setColor(Colors.Blue);
      if (!nameChange) return;
      if (nameChange) {
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${nameChange.old}\n+${nameChange.new}`),
          },
        ]);
      }
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
