import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  GuildBan,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { bans } from "..";

export class GuildBanAddListener extends Listener<Events.GuildBanAdd> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildBanAdd,
    });
  }
  public async run(ban: GuildBan) {
    const logsSchema = await LogsSchema.find(ban.client, ban.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.GuildBanAdd].toggled) {
      const channelToSend = (await ban.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildBanAdd].channel
      )) as TextChannel;
      const auditLogs = await ban.guild.fetchAuditLogs();
      const banAuditLogs = auditLogs.entries.filter(
        (logs) =>
          logs.action === AuditLogEvent.MemberBanAdd &&
          logs.target === ban.user &&
          logs.createdTimestamp + 2000 > Date.now()
      );
      const banAuditLog = banAuditLogs
        .filter((log) => log.target === ban.user)
        .first();
      const checkBan = Object.values(bans).find((str) =>
        str.includes(ban.user.id)
      );
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Member banned")
            .setFields([
              {
                name: "User:",
                value: `${userMention(ban.user.id)} (${ban.user.username})`,
                inline: true,
              },
              {
                name: "Banned by:",
                value: checkBan
                  ? userMention(
                      Object.keys(bans)[
                        Object.values(bans).findIndex((str) =>
                          str.includes(ban.user.id)
                        )
                      ]
                    )
                  : userMention(banAuditLog?.executorId!),
                inline: true,
              },
              {
                name: "Banned at:",
                value: time(
                  Math.floor(banAuditLog?.createdTimestamp! / 1000),
                  "F"
                ),
                inline: true,
              },
              {
                name: "Reason:",
                value: codeBlock(banAuditLog?.reason ?? "No reason provided"),
                inline: true,
              },
            ])
            .setColor(Colors.Red),
        ],
      });
    }
  }
}
