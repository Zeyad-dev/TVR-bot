import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  formatEmoji,
  userMention,
} from "discord.js";

export class SetNicknameCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-nickname")
        .setDescription("Changes the nickname of the specified user")
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to change the nickname of")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("nickname")
            .setDescription("The nickname to set for the specified user")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for the ban")
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageNicknames)
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
        PermissionsBitField.Flags.ManageNicknames
      )
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I am missing the \`Manage Nicknames\` permission!`
            )
            .setColor(Colors.Red),
        ],
      });
    const user = interaction.options.getUser("user", true);
    const nickname = interaction.options.getString("nickname", true);
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    let memberToChangeNickname: GuildMember;
    try {
      memberToChangeNickname = await interaction.guild!.members.fetch(user);
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
    if (!memberToChangeNickname.manageable)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I can't change this user's nickname!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (
      member.roles.highest.comparePositionTo(
        memberToChangeNickname.roles.highest
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
              )} | You do not have the permissions to change the nickname of this user!`
            )
            .setColor(Colors.Red),
        ],
      });
    await memberToChangeNickname.setNickname(nickname, reason);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${userMention(
              memberToChangeNickname.id
            )}'s nickname has been changed successfully!`
          )
          .setFields([
            {
              name: "New Nickname:",
              value: nickname,
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
  }
}
