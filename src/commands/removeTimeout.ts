import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  formatEmoji,
  userMention,
} from "discord.js";

export class RemoveTimeoutCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("remove-timeout")
        .setDescription("Removes a timeout from the specified user.")
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove the timeout from")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for removing the timeout")
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
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
        PermissionsBitField.Flags.ModerateMembers
      )
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I am missing the \`Timeout Members\` permission!`
            )
            .setColor(Colors.Red),
        ],
      });
    const user = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    let memberToRemoveTimeout: GuildMember;
    try {
      memberToRemoveTimeout = await interaction.guild!.members.fetch(user);
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
    if (!memberToRemoveTimeout.moderatable)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user's timeout can not be removed by me!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (
      member.roles.highest.comparePositionTo(
        memberToRemoveTimeout.roles.highest
      ) < 0 &&
      interaction.guild!.ownerId != interaction.user.id
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You do not have the permissions to remove a timeout from this user!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (!memberToRemoveTimeout.isCommunicationDisabled())
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user is is not on a timeout!`
            )
            .setColor(Colors.Red),
        ],
      });
    await memberToRemoveTimeout.timeout(null, reason);
    try {
      await memberToRemoveTimeout.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `Your timeout has been removed in **${interaction.guild!.name}**!`
            )
            .setFields([
              {
                name: "Timeout removed by:",
                value: `${interaction.user.username} (${interaction.user.id})`,
                inline: true,
              },
              {
                name: "Reason:",
                value: reason,
                inline: true,
              },
            ])
            .setColor(Colors.Green),
        ],
      });
    } catch (err) {}
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${userMention(
              memberToRemoveTimeout.id
            )}'s timeout has been removed successfully!`
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
