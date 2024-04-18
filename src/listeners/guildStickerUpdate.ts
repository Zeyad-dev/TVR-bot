import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  GuildEmoji,
  Sticker,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class GuildStickerUpdateListener extends Listener<Events.GuildStickerUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildStickerUpdate,
    });
  }
  public async run(sticker: Sticker) {
    if (sticker instanceof GuildEmoji === false) return;
    const logsSchema = await LogsSchema.find(sticker.client, sticker.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildStickerUpdate].toggled
    ) {
      const channelToSend = (await sticker.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildStickerUpdate].channel
      )) as TextChannel;
      const auditLogs = await sticker.guild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.StickerUpdate &&
            logs.targetId === sticker.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const nameChange = emojiAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const descriptionChange = emojiAuditLog?.changes.find(
        (change) => change.key === "description"
      );
      const embed = new EmbedBuilder()
        .setTitle("Sticker updated")
        .addFields([
          {
            name: "Sticker name:",
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
        .setThumbnail(sticker.imageURL())
        .setColor(Colors.Blue);
      if (!nameChange && !descriptionChange) return;
      if (nameChange) {
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${nameChange.old}\n+${nameChange.new}`),
          },
        ]);
      }
      if (descriptionChange) {
        embed.addFields([
          {
            name: "Description:",
            value: codeBlock(
              "diff",
              `-${descriptionChange.old}\n+${descriptionChange.new}`
            ),
          },
        ]);
      }
      if (embed.data.fields?.length! <= 3) return;
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
