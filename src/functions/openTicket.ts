import {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  userMention,
  formatEmoji,
  channelMention,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";
import { ticketPermissions } from "./ticketPermissions";

export async function openTicket(
  interaction: StringSelectMenuInteraction,
  schema: TicketsSchema,
  reason: string
) {
  await interaction.deferReply({
    ephemeral: true,
  });
  schema.raw.ticketsCount++;
  if (
    schema.raw.tickets.find(
      (ticket) => ticket.author === interaction.user.id && ticket.isOpen
    )
  )
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | You already have an open ticket! Please close the pending ticket before opening a new one!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = await interaction.guild?.channels.create({
    name: `ticket-${schema.raw.ticketsCount}`,
    permissionOverwrites: await ticketPermissions(
      interaction,
      schema,
      "opened",
      reason === "staffComplaint" ? true : false
    ),
    parent: schema.raw.category,
  });
  let description: string = "";
  let title: string = ";";
  if (reason === "generalQuestions") {
    title = "General Questions";
    description = `Thank you for reaching out! In order to assist you effectively, please provide as much detail as possible regarding your question. A support member will be with you shortly to help resolve your inquiries. Thank you for your patience!`;
  } else if (reason === "generalSupport") {
    title = "General Support";
    description = `Thank you for reaching out for support! To assist you promptly, please provide as much detail as possible regarding your issue or concern. Our support team is here to help and will address your query shortly. Thank you for your cooperation!`;
  } else if (reason === "techSupport") {
    title = "Tech Support";
    description = `Thank you for contacting our support team! To best assist you, please provide detailed information about the technical issue you're experiencing. Our support staff will work swiftly to resolve your problem. Thank you for your cooperation!`;
  } else if (reason === "memberComplaint") {
    title = "Member Complaint";
    description = `Thank you for bringing this matter to our attention. To ensure we address your concern appropriately, please provide the following details:\n* Name of the member involved\n* Discord ID\n* Reason for the complaint\n\nOur team will investigate the issue promptly and take appropriate action. Thank you for your cooperation!`;
  } else if (reason === "staffComplaint") {
    title = "Staff Complaint";
    description = `Thank you for reaching out regarding a staff-related concern. For us to address this matter effectively, kindly provide the following details:\n* Name of the staff member involved\n* Reason for the complaint\nPlease note that only administrators will have access to view this ticket to ensure confidentiality and impartiality in the investigation process.`;
  }
  const welcomeMessage = (await channel?.send({
    content: `${userMention(interaction.user.id)}`,
    embeds: [
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(Colors.Blue)
        .setFooter({
          text: `Brought to you by ${interaction.client.user.username} • Your satisfaction is our top priority!`,
          iconURL: interaction.client.user.displayAvatarURL(),
        }),
    ],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setLabel("Close")
          .setCustomId("close")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
        new ButtonBuilder()
          .setLabel("Claim")
          .setCustomId("claim")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🙋‍♂️")
      ),
    ],
  }))!.id;
  const ticketData = {
    id: schema.raw.ticketsCount,
    openedAt: Date.now(),
    author: interaction.user.id,
    claimedBy: null,
    purpose: reason,
    closedBy: null,
    closeReason: null,
    channelId: channel!.id,
    welcomeMessage,
    isOpen: true,
    transcript: null,
  };
  schema.raw.tickets.length === 0
    ? (schema.raw.tickets = [ticketData])
    : schema.raw.tickets.push(ticketData);
  await schema.update(schema.raw);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Your ticket has been opened at ${channelMention(channel!.id)}!`
        )
        .setColor(Colors.Green),
    ],
  });
}
