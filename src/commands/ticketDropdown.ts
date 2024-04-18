import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  channelMention,
  formatEmoji,
  ChannelType,
  PermissionsBitField,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";

export class TicketDropdownCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-ticket-dropdown-channel")
        .setDescription(
          "Sets the channel for the ticket dropdown selection message to be sent to."
        )
        .setDMPermission(false)
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "The channel where the ticket dropdown selection message will be sent to."
            )
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
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
    const channel = interaction.options.getChannel(
      "channel",
      true
    ) as TextChannel;
    if (ticketsSchema.raw.ticketSelectionMessage) {
      const messageChannel = (await interaction.guild?.channels.fetch(
        ticketsSchema.raw.ticketSelectionMessage.channelId
      )) as TextChannel;
      const messageToDelete = await messageChannel.messages.fetch(
        ticketsSchema.raw.ticketSelectionMessage.id
      );
      await messageToDelete.delete();
    }
    const message = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Select a Level of Support.")
          .setDescription(
            "**Please Select a ticket corresponding to your issue.**\n\n__General Questions__ - This is used for general questions or support.\n\n__General Support__ - This is used for any support NOT involving FiveM, Discord, TeamSpeak, Sonoran CMS/CAD/Radio.\n\n__Tech Support__ - use this for when you need assistance from a member of staff with Discord, TeamSpeak, Sonoran CMS/CAD/Radio, and FiveM.\n\n__Member Complaint__ - Used for when you have an issue with another member within the community that is not staff. Please ensure that the member has broken a rule or you believe they broke a rule.\n\n__Staff Complaint__ - Used when you have an issue with a member of staff. This ticket can only be seen by the Administration Team."
          )
          .setColor(Colors.Blue),
      ],
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents([
          new StringSelectMenuBuilder()
            .setCustomId("ticketDropdown")
            .setMaxValues(1)
            .setPlaceholder("Select a level of support here")
            .addOptions([
              new StringSelectMenuOptionBuilder()
                .setLabel("General Questions")
                .setEmoji("❓")
                .setValue("generalQuestions"),
              new StringSelectMenuOptionBuilder()
                .setLabel("General Support")
                .setValue("generalSupport")
                .setEmoji("💁‍♂️"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Tech Support")
                .setValue("techSupport")
                .setEmoji("⚙️"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Member Complaint")
                .setValue("memberComplaint")
                .setEmoji("📩"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Staff complaint")
                .setValue("staffComplaint")
                .setEmoji("📩"),
            ]),
        ]),
      ],
    });
    await ticketsSchema.update({
      ticketSelectionMessage: {
        channelId: channel.id,
        id: message.id,
      },
    });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221897469592600677",
              true
            )} | The ticket dropdown menu message has been successfully sent to ${channelMention(
              channel.id
            )}`
          )
          .setColor(Colors.Green),
      ],
    });
  }
}
