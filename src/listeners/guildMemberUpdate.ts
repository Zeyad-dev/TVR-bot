import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  EmbedBuilder,
  Events,
  GuildMember,
  Role,
  codeBlock,
  userMention,
  TextChannel,
  Colors,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class GuildMemberUpdateListener extends Listener<Events.GuildMemberUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildMemberUpdate,
    });
  }
  public async run(_oldMember: GuildMember, newMember: GuildMember) {
    const logsSchema = await LogsSchema.find(
      newMember.client,
      newMember.guild.id
    );
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildMemberUpdate].toggled
    ) {
      const channel = (await newMember.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildMemberUpdate].channel
      )) as TextChannel;
      const auditLogs = await newMember.guild.fetchAuditLogs();
      const memberAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.MemberUpdate &&
            logs.targetId === newMember.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const memberRoleAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.MemberRoleUpdate &&
            logs.targetId === newMember.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();

      const embed = new EmbedBuilder()
        .setTitle("Member updated")
        .addFields([
          { name: "Member:", value: userMention(newMember.id), inline: true },
          { name: "Member ID:", value: codeBlock(newMember.id), inline: true },
          {
            name: "Updated by:",
            value: userMention(
              memberAuditLog
                ? memberAuditLog.executorId!
                : memberRoleAuditLog?.executorId!
            ),
            inline: true,
          },
        ])
        .setColor(Colors.Blue)
        .setThumbnail(newMember.displayAvatarURL());
      const nameChange = memberAuditLog?.changes.find(
        (change) => change.key === "nick"
      );
      if (nameChange) {
        embed.addFields([
          {
            name: "Nickname:",
            value: codeBlock(
              "diff",
              `-${nameChange!.old || "No nickname set"}\n+${
                nameChange!.new || "No nickname set"
              }`
            ),
          },
        ]);
      }
      const addedRoles = memberRoleAuditLog?.changes.find(
        (change) => change.key === "$add"
      );
      const removedRoles = memberRoleAuditLog?.changes.find(
        (change) => change.key === "$remove"
      );
      if (addedRoles || removedRoles) {
        embed.addFields([
          {
            name: "Roles:",
            value: codeBlock(
              "diff",
              `${
                addedRoles
                  ? (addedRoles.new as Role[]).map(
                      (v) => `+${v.name} (${v.id})\n`
                    )
                  : "\n"
              }${
                removedRoles
                  ? (removedRoles.new as Role[]).map(
                      (v) => `-${v.name} (${v.id})`
                    )
                  : "\n"
              }`
            ),
          },
        ]);
      }
      if (embed.data.fields?.length! <= 3) return;
      await channel.send({
        embeds: [embed],
      });
    }
  }
}
