import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  formatEmoji,
} from "@discordjs/builders";
import { Command } from "@sapphire/framework";
import { Colors, ModalBuilder, TextInputStyle } from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";

export class CloseCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("close")
        .setDescription("Closes the current ticket.")
        .setDMPermission(false)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const schema = await TicketsSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (!schema)
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
    const ticket = schema.raw.tickets.find(
      (ticket) => ticket.channelId === interaction.channel!.id
    );
    if (!ticket)
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | Please run this command in a valid ticket channel!`
            )
            .setColor(Colors.Red),
        ],
      });
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId("closeModal")
        .setTitle("Reason for closing the ticket (optional)")
        .addComponents(
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("reason")
              .setLabel("Provide the reason here (optional):")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Example: "Issue resolved"')
              .setRequired(false)
          )
        )
    );
  }
}
