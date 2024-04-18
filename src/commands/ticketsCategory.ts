import { Command } from "@sapphire/framework";
import {
  Colors,
  EmbedBuilder,
  channelMention,
  formatEmoji,
  ChannelType,
  PermissionsBitField,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";

export class TicketsCategoryCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-ticket-category")
        .setDescription("Set the category that tickets will be created in.")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("The category that tickets will be created in")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true,
    });
    const ticketsSchema = await TicketsSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (!ticketsSchema)
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | Please initiate the ticket system first using </tickets-setup:1225427374863028276>!`
            )
            .setColor(Colors.Red),
        ],
      });
    const category = interaction.options.getChannel("category", true);
    await ticketsSchema.update({
      category: category.id,
    });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${channelMention(
              category.id
            )} has been set as the category channel for tickets!\n\nFuture tickets will be created in this category!`
          )
          .setColor(Colors.Green),
      ],
    });
  }
}
