import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Channel,
  Colors,
  EmbedBuilder,
  Events,
  PermissionsBitField,
  Snowflake,
  TextChannel,
  channelMention,
  codeBlock,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class WebhooksUpdateListener extends Listener<Events.WebhooksUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.WebhooksUpdate,
    });
  }
  public async run(channel: Channel) {
    if (channel.isDMBased()) return;
    if (
      !(await channel.guild.members.fetchMe()).permissions.has(
        PermissionsBitField.Flags.ManageWebhooks
      )
    )
      return;
    const logsSchema = await LogsSchema.find(channel.client, channel.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.WebhooksUpdate].toggled) {
      const channelToSend = (await channel.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.WebhooksUpdate].channel
      )) as TextChannel;
      const auditLogs = await channel.guild.fetchAuditLogs();
      const channelAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.WebhookUpdate &&
            //@ts-expect-error
            logs.target.channelId === channel.id
        )
        .first();
      const webhook = (await channel.guild.fetchWebhooks()).find(
        (w) => w.id === channelAuditLog?.targetId
      );
      const channelChange = channelAuditLog?.changes.find(
        (change) => change.key === "channel_id"
      );
      const nameChange = channelAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const avatarChange = channelAuditLog?.changes.find(
        (change) => change.key === "avatar_hash"
      );
      const embed = new EmbedBuilder()
        .setTitle(`Webhook updated`)
        .setThumbnail(webhook?.avatarURL()!)
        .addFields([
          {
            name: `Webhook's name:`,
            value: codeBlock(
              nameChange ? (nameChange.old as string) : webhook!.name
            ),
            inline: true,
          },
          {
            name: `Webhook's ID:`,
            value: codeBlock(webhook!.id),
            inline: true,
          },
          {
            name: `Updated by:`,
            value: userMention(channelAuditLog?.executorId!),
            inline: true,
          },
        ])
        .setColor(Colors.Blue);
      if (nameChange)
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${nameChange.old}\n+${nameChange.new}`),
            inline: true,
          },
        ]);
      if (channelChange) {
        embed.addFields([
          {
            name: "Channel:",
            value: `\`Old channel:\` ${channelMention(
              channelChange.old as Snowflake
            )}\n\`New channel:\` ${channelMention(
              channelChange.new as Snowflake
            )}`,
          },
        ]);
      }
      if (avatarChange)
        embed.addFields([
          {
            name: "Slowmode:",
            value: `${
              avatarChange.old
                ? `[Old avatar](https://cdn.discordapp.com/avatars/${
                    webhook!.id
                  }/${avatarChange.old})`
                : `\`Old avatar:\` No icon!`
            }\n${
              avatarChange.new
                ? `[New avatar](https://cdn.discordapp.com/avatars/${
                    webhook!.id
                  }/${avatarChange.new})`
                : `\`New avatar:\` No icon!`
            }`,
          },
        ]);
      if (embed.data.fields?.length! <= 3) return;
      channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
