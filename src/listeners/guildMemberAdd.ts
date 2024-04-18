import { Listener } from "@sapphire/framework";
import {
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
import { findDifferentUses } from "../functions/findDifferentUses";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
export class GuildMemberAddListener extends Listener<Events.GuildMemberAdd> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildMemberAdd,
    });
  }
  public async run(member: GuildMember) {
    const schema = await InviteTrackerSchema.find(
      member.client,
      member.guild.id
    );
    if (schema) {
      const guildInvites = await member.guild.invites.fetch();
      const invite = findDifferentUses(
        schema.raw.savedInvites,
        guildInvites.map((guildInvite) => {
          return { inviteCode: guildInvite.code, uses: guildInvite.uses! };
        })
      )[0];
      const savedInvite = schema.raw.savedInvites.find(
        (savedInvite) => savedInvite.code === invite
      );
      if (savedInvite) {
        savedInvite.uses++;
        savedInvite.invitesCount++;
        savedInvite.users.push(member.id);
        await schema.update(schema.raw);
      }
    }
    const logsSchema = await LogsSchema.find(member.client, member.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.GuildMemberAdd].toggled) {
      const channel = (await member.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildMemberAdd].channel
      )) as TextChannel;
      const inviteData = schema?.raw.savedInvites.find((invites) =>
        invites.users.includes(member.id)
      );
      let totalInvites: number = 0;
      if (inviteData) {
        schema!.raw.savedInvites
          .filter((invite) => invite.inviter === inviteData.inviter)
          .forEach((invite) => (totalInvites += invite.invitesCount));
      }
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("New member joined")
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
                name: "Account created on:",
                value: `${time(
                  Math.floor(member.user.createdTimestamp / 1000),
                  "F"
                )} (${time(
                  Math.floor(member.user.createdTimestamp / 1000),
                  "R"
                )})`,
              },
              {
                name: "Inviter data:",
                value: `${
                  inviteData
                    ? `They have been invited by ${userMention(
                        inviteData.inviter
                      )} who now has ${totalInvites} invite${
                        totalInvites <= 1 ? "" : "s"
                      }!`
                    : `I could not trace how this user has joined the server!`
                }`,
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    }
  }
}
