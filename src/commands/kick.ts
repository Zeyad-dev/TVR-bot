import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  formatEmoji,
  userMention,
} from "discord.js";
import { kicks } from "..";

export class KickCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("kick")
        .setDescription("Kicks the specified user from the server.")
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to kick")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason of the kick")
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
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
        PermissionsBitField.Flags.KickMembers
      )
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I am missing the \`Kick Members\` permission!`
            )
            .setColor(Colors.Red),
        ],
      });
    const user = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    let memberToKick: GuildMember;
    try {
      memberToKick = await interaction.guild!.members.fetch(user);
    } catch (err) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | Please specify a valid user in this server!`
            )
            .setColor(Colors.Red),
        ],
      });
    }
    const member = await interaction.guild!.members.fetch(interaction.user);
    if (!memberToKick.kickable)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user can not be kicked by me!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (
      member.roles.highest.comparePositionTo(memberToKick.roles.highest) < 0 &&
      interaction.guild!.ownerId != interaction.user.id
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You do not have the permissions to kick this user!`
            )
            .setColor(Colors.Red),
        ],
      });
    try {
      await memberToKick.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `You have been kicked from **${interaction.guild!.name}**!`
            )
            .setFields([
              {
                name: "Kicked by:",
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
    await memberToKick.kick(reason);
    if (Object.values(kicks).find((str) => str.includes(user.id))) {
      const index = Object.values(kicks).findIndex((str) =>
        str.includes(user.id)
      );
      kicks[Object.keys(kicks)[index]].splice(index, 1);
    }
    kicks[interaction.user.id]
      ? kicks[interaction.user.id].push(user.id)
      : (kicks[interaction.user.id] = [user.id]);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${userMention(
              memberToKick.id
            )} has been kicked from the server!`
          )
          .setFields([
            {
              name: "Reason:",
              value: reason,
              inline: true,
            },
          ])
          .setColor(Colors.Green),
      ],
    });
  }
}
