import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  Sticker,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class GuildStickerDeleteListener extends Listener<Events.GuildStickerDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildStickerDelete,
    });
  }
  public async run(sticker: Sticker) {
    if (!sticker.guild) return;
    const logsSchema = await LogsSchema.find(sticker.client, sticker.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildStickerDelete].toggled
    ) {
      const channelToSend = (await sticker.guild!.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildStickerDelete].channel
      )) as TextChannel;
      const auditLogs = await sticker.guild.fetchAuditLogs();
      const stickerAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.StickerDelete &&
            logs.targetId === sticker.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const embed = new EmbedBuilder()
        .setTitle("Sticker deleted")
        .setFields([
          {
            name: "Emoji name:",
            value: codeBlock(`${sticker.name} (${sticker.id})`),
          },
          {
            name: "Deleted by:",
            value: userMention(stickerAuditLog!.executorId!),
            inline: true,
          },
          {
            name: "Deleted at:",
            value: time(
              Math.floor(stickerAuditLog?.createdTimestamp! / 1000),
              "F"
            ),
            inline: true,
          },
        ])
        .setThumbnail(sticker.url)
        .setColor(Colors.Red);
      if (sticker.description)
        embed.addFields([
          {
            name: "Sticker description:",
            value: codeBlock(sticker.description),
            inline: true,
          },
        ]);
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
