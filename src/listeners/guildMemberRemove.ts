import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  TextChannel,
  codeBlock,
  time,
  userMention,
} from "discord.js";
import { InviteTrackerSchema } from "../schemas/inviteTracker";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { kicks } from "..";

export class GuildMemberRemoveListener extends Listener<Events.GuildMemberRemove> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildMemberRemove,
    });
  }
  public async run(member: GuildMember) {
    const schema = await InviteTrackerSchema.find(
      member.client,
      member.guild!.id
    );
    if (schema) {
      const invite = schema.raw.savedInvites.find((data) =>
        data.users.includes(member.id)
      );
      if (invite) {
        invite.users.splice(invite.users.indexOf(member.id), 1);
        invite.invitesCount--;
        await schema.update(schema.raw);
      }
    }
    const logsSchema = await LogsSchema.find(member.client, member.guild.id);
    if (
      logsSchema &&
      logsSchema.raw.logs[EventsEnum.GuildMemberRemove].toggled
    ) {
      const auditLogs = await member.guild.fetchAuditLogs();
      const memberAuditLog = auditLogs.entries
        .filter(
          (logs) =>
            logs.action === AuditLogEvent.MemberKick &&
            logs.targetId === member.id &&
            logs.createdTimestamp + 2000 > Date.now()
        )
        .first();
      const channel = (await member.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildMemberRemove].channel
      )) as TextChannel;
      const checkKick = Object.values(kicks).find((str) =>
        str.includes(member.id)
      );
      if (memberAuditLog) {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Member kicked")
              .setFields([
                {
                  name: "User:",
                  value: `${userMention(member.id)} - ${member.id}`,
                },
                {
                  name: "Kicked by:",
                  value: checkKick
                    ? userMention(
                        Object.keys(kicks)[
                          Object.values(kicks).findIndex((str) =>
                            str.includes(member.id)
                          )
                        ]
                      )
                    : userMention(memberAuditLog?.executorId!),
                  inline: true,
                },
                {
                  name: "Kicked at:",
                  value: time(
                    Math.floor(memberAuditLog.createdTimestamp / 1000),
                    "F"
                  ),
                  inline: true,
                },
                {
                  name: "Reason of kick:",
                  value: codeBlock(memberAuditLog.reason!),
                  inline: true,
                },
              ])
              .setColor(Colors.Red),
          ],
        });
      } else {
        channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Member left the server")
              .setFields([
                {
                  name: "User:",
                  value: userMention(member.id),
                  inline: true,
                },
                {
                  name: "User id:",
                  value: codeBlock(member.id),
                  inline: true,
                },
                {
                  name: "Joined at:",
                  value: `${time(
                    Math.floor(member.joinedTimestamp! / 1000),
                    "F"
                  )} (${time(
                    Math.floor(member.joinedTimestamp! / 1000),
                    "R"
                  )})`,
                  inline: true,
                },
                {
                  name: "Left at:",
                  value: `${time(Math.floor(Date.now() / 1000), "F")} (${time(
                    Math.floor(Date.now() / 1000),
                    "R"
                  )})`,
                  inline: true,
                },
                {
                  name: "Account created on:",
                  value: `${time(
                    Math.floor(member.user.createdTimestamp / 1000),
                    "F"
                  )} (${time(
                    Math.floor(member.user.createdTimestamp / 1000),
                    "R"
                  )})`,
                },
              ])
              .setColor(Colors.Red),
          ],
        });
      }
    }
  }
}
