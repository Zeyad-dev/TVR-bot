import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  GuildExplicitContentFilter,
  Snowflake,
  TextChannel,
  channelMention,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { readableExplicitFilter } from "../functions/readableExplicitFilter";
import { readableVerificationLevel } from "../functions/readableVerificationLevel";

export class GuildUpdateListener extends Listener<Events.GuildUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildUpdate,
    });
  }
  public async run(oldGuild: Guild, newGuild: Guild) {
    const logsSchema = await LogsSchema.find(newGuild.client, newGuild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.GuildUpdate].toggled) {
      const channelToSend = (await newGuild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildUpdate].channel
      )) as TextChannel;
      const auditLogs = await newGuild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.GuildUpdate &&
            logs.targetId === newGuild.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const nameChange = emojiAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const mfaChange = emojiAuditLog?.changes.find(
        (change) => change.key === "mfa_level"
      );
      const systemChannelChange = emojiAuditLog?.changes.find(
        (change) => change.key === "system_channel_id"
      );
      const rulesChannelChange = emojiAuditLog?.changes.find(
        (change) => change.key === "rules_channel_id"
      );
      const afkChannelChange = emojiAuditLog?.changes.find(
        (change) => change.key === "afk_channel_id"
      );
      const publicUpdatesChannelChange = emojiAuditLog?.changes.find(
        (change) => change.key === "public_updates_channel_id"
      );
      const descriptionChange = emojiAuditLog?.changes.find(
        (change) => change.key === "description"
      );
      const ownerChange = emojiAuditLog?.changes.find(
        (change) => change.key === "owner_id"
      );
      const explicitContentFilterChange = emojiAuditLog?.changes.find(
        (change) => change.key === "explicit_content_filter"
      );
      const verificationLevelChange = emojiAuditLog?.changes.find(
        (change) => change.key === "verification_level"
      );
      const vanityURLCodeChange = emojiAuditLog?.changes.find(
        (change) => change.key === "vanity_url_code"
      );
      const iconChange = emojiAuditLog?.changes.find(
        (change) => change.key === "icon_hash"
      );
      const embed = new EmbedBuilder()
        .setTitle("Server updated")
        .addFields([
          {
            name: "Updated by:",
            value: userMention(emojiAuditLog?.executorId!),
            inline: true,
          },
          {
            name: "Updated at:",
            value: time(
              Math.floor(emojiAuditLog?.createdTimestamp! / 1000),
              "F"
            ),
            inline: true,
          },
        ])
        .setColor(Colors.Blue);
      if (nameChange) {
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${nameChange.old}\n+${nameChange.new}`),
            inline: true,
          },
        ]);
      }
      if (mfaChange) {
        embed.addFields([
          {
            name: "2fa requirement for moderators:",
            value: codeBlock(
              "diff",
              `-${mfaChange.new ? "Disabled" : "Enabled"}\n+${
                mfaChange.new ? "Enabled" : "Disabled"
              }`
            ),
            inline: true,
          },
        ]);
      }
      if (systemChannelChange) {
        embed.addFields([
          {
            name: "System message channel:",
            value: `\`Old channel:\` ${
              systemChannelChange.old
                ? channelMention(systemChannelChange.old as Snowflake)
                : "No channel set"
            }\n\`New channel:\` ${
              systemChannelChange.new
                ? channelMention(systemChannelChange.new as Snowflake)
                : "No channel set"
            }`,
            inline: true,
          },
        ]);
      }
      if (rulesChannelChange) {
        embed.addFields([
          {
            name: "Rules channel:",
            value: `\`Old channel:\` ${
              rulesChannelChange.old
                ? channelMention(rulesChannelChange.old as Snowflake)
                : "No channel set"
            }\n\`New channel:\` ${
              rulesChannelChange.new
                ? channelMention(rulesChannelChange.new as Snowflake)
                : "No channel set"
            }`,
            inline: true,
          },
        ]);
      }
      if (afkChannelChange) {
        embed.addFields([
          {
            name: "AFK channel:",
            value: `\`Old channel:\` ${
              afkChannelChange.old
                ? channelMention(afkChannelChange.old as Snowflake)
                : "No channel set"
            }\n\`New channel:\` ${
              afkChannelChange.new
                ? channelMention(afkChannelChange.new as Snowflake)
                : "No channel set"
            }`,
            inline: true,
          },
        ]);
      }
      if (publicUpdatesChannelChange) {
        embed.addFields([
          {
            name: "Public updates channel:",
            value: `\`Old channel:\` ${
              publicUpdatesChannelChange.old
                ? channelMention(publicUpdatesChannelChange.old as Snowflake)
                : "No channel set"
            }\n\`New channel:\` ${
              publicUpdatesChannelChange.new
                ? channelMention(publicUpdatesChannelChange.new as Snowflake)
                : "No channel set"
            }`,
            inline: true,
          },
        ]);
      }
      if (descriptionChange) {
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock(
              "diff",
              `-${descriptionChange.old || "No description"}\n+${
                descriptionChange.new || "No description"
              }`
            ),
            inline: true,
          },
        ]);
      }
      if (ownerChange) {
        embed.addFields([
          {
            name: "Name:",
            value: `\`Old owner:\` ${userMention(
              ownerChange.old as Snowflake
            )}\n\`New owner:\` ${userMention(ownerChange.new as Snowflake)}`,
            inline: true,
          },
        ]);
      }
      if (explicitContentFilterChange) {
        embed.addFields([
          {
            name: "Explicit content filter:",
            value: codeBlock(
              "diff",
              `-${readableExplicitFilter(
                explicitContentFilterChange.old as GuildExplicitContentFilter
              )}\n+${readableExplicitFilter(
                explicitContentFilterChange.new as GuildExplicitContentFilter
              )}`
            ),
            inline: true,
          },
        ]);
      }
      if (verificationLevelChange) {
        embed.addFields([
          {
            name: "Verification level:",
            value: codeBlock(
              "diff",
              `-${readableVerificationLevel(
                verificationLevelChange.old as number
              )}\n+${readableVerificationLevel(
                verificationLevelChange.new as number
              )}`
            ),
            inline: true,
          },
        ]);
      }
      if (vanityURLCodeChange) {
        embed.addFields([
          {
            name: "Vanity url code:",
            value: codeBlock(
              "diff",
              `-${vanityURLCodeChange.old} (https://discord.gg/${vanityURLCodeChange.old})\n+${vanityURLCodeChange.new} (https://discord.gg/${vanityURLCodeChange.new})`
            ),
            inline: true,
          },
        ]);
      }
      if (iconChange) {
        embed.addFields([
          {
            name: "Icon:",
            value: `${
              oldGuild.iconURL()
                ? `[Old icon](${oldGuild.iconURL()})`
                : `\`Old icon:\` No icon!`
            }\n${
              newGuild.iconURL()
                ? `[New icon](${newGuild.iconURL()})`
                : `\`New icon:\` No icon!`
            }`,
            inline: true,
          },
        ]);
      }
      if (oldGuild.verified !== newGuild.verified) {
        embed.addFields([
          {
            name: "Server verified:",
            value: codeBlock(
              "diff",
              `-${oldGuild.verified ? "Verified" : "Not verified"}\n+${
                newGuild.verified ? "Verified" : "Not verified"
              }`
            ),
            inline: true,
          },
        ]);
      }
      if (oldGuild.partnered !== newGuild.partnered) {
        embed.addFields([
          {
            name: "Server partnership status:",
            value: codeBlock(
              "diff",
              `-${oldGuild.partnered ? "Partnered" : "Not partnered"}\n+${
                newGuild.partnered ? "Partnered" : "Not partnered"
              }`
            ),
            inline: true,
          },
        ]);
      }
      if (
        oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount
      ) {
        embed.addFields([
          {
            name: "Server boosts:",
            value: codeBlock(
              "diff",
              `-${oldGuild.premiumSubscriptionCount} (Level ${oldGuild.premiumTier})\n+${newGuild.premiumSubscriptionCount} (Level ${newGuild.premiumTier})`
            ),
            inline: true,
          },
        ]);
      }
      if (embed.data.fields?.length! <= 2) return;
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
