import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  Role,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class GuildRoleDeleteListener extends Listener<Events.GuildRoleDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildRoleDelete,
    });
  }
  public async run(role: Role) {
    if (role.managed) return;
    const logsSchema = await LogsSchema.find(role.client, role.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.GuildRoleDelete].toggled) {
      const channelToSend = (await role.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildRoleDelete].channel
      )) as TextChannel;
      const auditLogs = await role.guild.fetchAuditLogs();
      const roleAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.RoleDelete &&
            logs.targetId === role.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      await channelToSend.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Role deleted")
            .setFields([
              {
                name: "Role name:",
                value: codeBlock(role.name),
                inline: true,
              },
              {
                name: "Role ID:",
                value: codeBlock(role.id),
                inline: true,
              },
              {
                name: "Deleted by:",
                value: userMention(roleAuditLog!.executorId!),
                inline: true,
              },
              {
                name: "Deleted at:",
                value: time(
                  Math.floor(roleAuditLog?.createdTimestamp! / 1000),
                  "F"
                ),
                inline: true,
              },
            ])
            .setColor(Colors.Red),
        ],
      });
    }
  }
}
