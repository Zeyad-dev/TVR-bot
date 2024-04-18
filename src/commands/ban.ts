import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GuildMember,
  formatEmoji,
  userMention,
  PermissionsBitField,
} from "discord.js";
import { bans } from "..";
export class BanCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("ban")
        .setDescription("Bans the specified user from the server")
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to ban from the server")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for the ban")
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true,
    });
    if (
      !(await interaction.guild!.members.fetchMe()).permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I am missing the \`Ban Members\` permission!`
            )
            .setColor(Colors.Red),
        ],
      });
    const user = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    const guildBans = await interaction.guild!.bans.fetch();
    if (guildBans.find((ban) => ban.user === user))
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user is already banned!`
            )
            .setColor(Colors.Red),
        ],
      });
    let memberToBan: GuildMember | null;
    try {
      memberToBan = await interaction.guild!.members.fetch(user);
    } catch (err) {
      memberToBan = null;
    }
    const member = await interaction.guild!.members.fetch(interaction.user);
    if (memberToBan) {
      if (!memberToBan.bannable)
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221828309743046677",
                  true
                )} | This user can not be banned by me!`
              )
              .setColor(Colors.Red),
          ],
        });
      if (
        member.roles.highest.comparePositionTo(memberToBan.roles.highest) < 0 &&
        interaction.guild!.ownerId != interaction.user.id
      )
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221828309743046677",
                  true
                )} | You do not have the permissions to ban this user!`
              )
              .setColor(Colors.Red),
          ],
        });
      try {
        await memberToBan.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `You have been banned in **${interaction.guild!.name}**!`
              )
              .setFields([
                {
                  name: "Banned by:",
                  value: `${interaction.user.username} (${interaction.user.id})`,
                  inline: true,
                },
                {
                  name: "Reason:",
                  value: reason,
                  inline: true,
                },
              ])
              .setColor(Colors.Red),
          ],
        });
      } catch (err) {}
      await memberToBan.ban({
        reason: reason,
        deleteMessageSeconds: 604800,
      });
      if (Object.values(bans).find((str) => str.includes(user.id))) {
        const index = Object.values(bans).findIndex((str) =>
          str.includes(user.id)
        );
        bans[Object.keys(bans)[index]].splice(index, 1);
      }
      bans[interaction.user.id]
        ? bans[interaction.user.id].push(user.id)
        : (bans[interaction.user.id] = [user.id]);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji("1221897469592600677", true)} | ${userMention(
                memberToBan.id
              )} has been banned successfully!`
            )
            .setFields([
              {
                name: "Reason:",
                value: reason,
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    } else {
      await interaction.guild!.bans.create(user, {
        reason: reason,
        deleteMessageSeconds: 604800,
      });
      if (Object.values(bans).find((str) => str.includes(user.id))) {
        const index = Object.values(bans).findIndex((str) =>
          str.includes(user.id)
        );
        bans[Object.keys(bans)[index]].splice(index, 1);
      }
      bans[interaction.user.id]
        ? bans[interaction.user.id].push(user.id)
        : (bans[interaction.user.id] = [user.id]);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji("1221897469592600677", true)} | ${userMention(
                user.id
              )} has been banned successfully!`
            )
            .setFields([
              {
                name: "Reason:",
                value: reason,
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    }
  }
}
