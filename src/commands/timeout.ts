import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  formatEmoji,
  time,
  userMention,
} from "discord.js";
import { timeToMilliseconds } from "../functions/timeToMS";

export class TimeoutCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("timeout")
        .setDescription("Adds a timeout to the specified user.")
        .setDMPermission(false)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to timeout")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription(
              "The duration of the timeout. Use this format: 1w/1d/1h/1m. Make sure to separated them by spaces."
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("The reason for the timeout")
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
    const duration = timeToMilliseconds(
      interaction.options.getString("duration", true)
    );
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    if (!duration)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | The time provided is invalid! Please make sure to follow the below syntax:\n\n\`(number)w\` for weeks, example: \`2w\` for 2 weeks\n\`(number)d\` for days, example: \`5d\` for 5 days\n\`(number)h\` for hours, example: \`1h\` for 1 hour\n\`(number)m\` for minutes, example: \`20m\` for 20 minutes`
            )
            .setColor(Colors.Red),
        ],
      });
    if (duration > 2419200000)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | The time provided exceeds the maximum duration of \`28 days\`!`
            )
            .setColor(Colors.Red),
        ],
      });
    let memberToTimeout: GuildMember;
    try {
      memberToTimeout = await interaction.guild!.members.fetch(user);
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
    if (!memberToTimeout.moderatable)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user can not be timed out by me!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (
      member.roles.highest.comparePositionTo(memberToTimeout.roles.highest) <
        0 &&
      interaction.guild!.ownerId != interaction.user.id
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You do not have the permissions to timeout this user!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (memberToTimeout.isCommunicationDisabled())
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user is already on a timeout!`
            )
            .setColor(Colors.Red),
        ],
      });
    await memberToTimeout.timeout(duration, reason);
    try {
      await memberToTimeout.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `You have been timed out in **${interaction.guild!.name}**!`
            )
            .setFields([
              {
                name: "Timed out by:",
                value: `${interaction.user.username} (${interaction.user.id})`,
                inline: true,
              },
              {
                name: "Timed out till:",
                value: time(Math.floor((Date.now() + duration) / 1000), "F"),
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
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${userMention(
              memberToTimeout.id
            )} has been timed out successfully!`
          )
          .setFields([
            {
              name: "Reason:",
              value: reason,
              inline: true,
            },
            {
              name: "Timed out till:",
              value: time(Math.floor((Date.now() + duration) / 1000), "F"),
              inline: true,
            },
          ])
          .setColor(Colors.Green),
      ],
    });
  }
}
