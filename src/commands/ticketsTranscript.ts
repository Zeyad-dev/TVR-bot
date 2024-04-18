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

export class TicketsTranscriptCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-transcript-channel")
        .setDescription("Set the channel where transcripts will be sent to.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel where transcripts will be sent to")
            .addChannelTypes(ChannelType.GuildText)
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
    const transcriptChannel = interaction.options.getChannel(
      "channel",
      true
    ).id;
    await ticketsSchema.update({
      transcriptChannel,
    });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji("1221897469592600677", true)} | ${channelMention(
              transcriptChannel
            )} has been set as the transcript channel for tickets!`
          )
          .setColor(Colors.Green),
      ],
    });
  }
}
