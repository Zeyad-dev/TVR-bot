import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  PermissionsBitField,
  formatEmoji,
  userMention,
} from "discord.js";
import { unbans } from "..";
export class UnbanCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("unban")
        .setDescription("Unbans the specified user from the server")
        .setDMPermission(false)
        .addStringOption((option) =>
          option
            .setName("user-id")
            .setDescription("The id of the user to unban from the server")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for the unban")
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
    const userId = interaction.options.getString("user-id", true);
    const reason =
      interaction.options.getString("reason") || "No reason specified";
    const guildBans = await interaction.guild!.bans.fetch();
    const user = await interaction.client.users.fetch(userId);
    if (!guildBans.find((ban) => ban.user === user))
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | This user is not banned!`
            )
            .setColor(Colors.Red),
        ],
      });
    try {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `You have been unbanned in **${interaction.guild!.name}**!`
            )
            .setFields([
              {
                name: "Unbanned by:",
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
    await interaction.guild?.bans.remove(user, reason);
    if (Object.values(unbans).find((str) => str.includes(user.id))) {
      const index = Object.values(unbans).findIndex((str) =>
        str.includes(user.id)
      );
      unbans[Object.keys(unbans)[index]].splice(index, 1);
    }
    unbans[interaction.user.id]
      ? unbans[interaction.user.id].push(user.id)
      : (unbans[interaction.user.id] = [user.id]);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${userMention(
              user.id
            )} has been unbanned successfully!`
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
