import { Listener } from "@sapphire/framework";
import {
  Events,
  BaseInteraction,
  ModalBuilder,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  formatEmoji,
  Colors,
  userMention,
  MessageActionRowComponentBuilder,
  ButtonBuilder,
  ButtonComponent,
  TextChannel,
  time,
  ButtonStyle,
  ButtonInteraction,
  GuildMember,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";
import { openTicket } from "../functions/openTicket";
import * as sourcebin from "sourcebin";
import { camelCaseToWords } from "../functions/camelCaseToWords";
import { WarnsSchema } from "../schemas/Warns";
import { handleColorAutocomplete } from "../functions/handleColorAutocomplete";
import { AutoResponsesSchema } from "../schemas/AutoResponses";
import { EventsEnum } from "../schemas/Logs";
export class InteractionCreateListener extends Listener<Events.InteractionCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.InteractionCreate,
    });
  }

  public async run(interaction: BaseInteraction) {
    const schema = await TicketsSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (schema) {
      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "ticketDropdown"
      ) {
        await openTicket(interaction, schema, interaction.values[0]);
      }
      if (interaction.isButton()) {
        if (interaction.customId === "close") {
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
        if (interaction.customId === "claim") {
          if (!checkPermission(interaction, schema))
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(
                    `$${formatEmoji(
                      "1221828309743046677",
                      true
                    )} | Only staff/support members can claim tickets!`
                  )
                  .setColor(Colors.Red),
              ],
              ephemeral: true,
            });
          const ticket = schema.raw.tickets.find(
            (ticket) => ticket.channelId === interaction.channel!.id
          );
          if (!ticket) return;
          ticket.claimedBy = interaction.user.id;
          const message = await interaction.channel?.messages.fetch(
            ticket.welcomeMessage
          );
          await message?.edit({
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder(
                  (
                    message.components[0].components[0] as ButtonComponent
                  ).toJSON()
                )
              ),
            ],
          });
          await schema.update(schema.raw);
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Claimed ticket")
                .setDescription(
                  `${formatEmoji(
                    "1221897469592600677",
                    true
                  )} | Your ticket will be handled by ${userMention(
                    interaction.user.id
                  )}!`
                )
                .setColor(Colors.Green),
            ],
          });
        }
      }
      if (
        interaction.isModalSubmit() &&
        interaction.customId === "closeModal"
      ) {
        const reason = interaction.fields.getTextInputValue("reason");
        const ticket = schema.raw.tickets.find(
          (ticket) => ticket.channelId === interaction.channel!.id
        )!;
        ticket.closeReason = reason;
        ticket.closedBy = interaction.user.id;
        ticket.isOpen = false;
        interaction.deferReply({
          ephemeral: true,
        });
        const transcriptBin = await sourcebin.create({
          title: `Transcript`,
          description: `All times are currently in GMT+4`,
          files: [
            {
              content: (await interaction.channel?.messages.fetch())!
                .reverse()
                .map(
                  (m) =>
                    `${new Date(m.createdAt).toLocaleString("en-US")} - ${
                      m.author.username
                    }: ${
                      m.attachments.size > 0
                        ? m.attachments.first()!.proxyURL
                        : m.content
                    }`
                )
                .join("\n"),
            },
          ],
        });
        ticket.transcript = transcriptBin.url;
        const channel = (await interaction.guild!.channels.fetch(
          schema.raw.transcriptChannel
        )) as TextChannel;
        const embed = new EmbedBuilder()
          .setTitle("Ticket closed")
          .setFields([
            {
              name: `${formatEmoji("1225771274953822229")} Ticket ID:`,
              value: String(ticket.id),
              inline: true,
            },
            {
              name: `${formatEmoji("1225771865092526151")} Ticket's purpose:`,
              value: camelCaseToWords(ticket.purpose),
              inline: true,
            },
            {
              name: `${formatEmoji("1225771696250814565")} Opened by:`,
              value: userMention(ticket.author),
              inline: true,
            },
            {
              name: `${formatEmoji("1225771743604637718")} Closed by:`,
              value: userMention(ticket.closedBy),
              inline: true,
            },
            {
              name: `${formatEmoji("1225771813850710079")} Opened at:`,
              value: time(Math.floor(ticket.openedAt / 1000), "F"),
              inline: true,
            },
            {
              name: `${formatEmoji("1225771849632452669")} Claimed by:`,
              value: ticket.claimedBy
                ? userMention(ticket.claimedBy)
                : "Not claimed",
              inline: true,
            },
            {
              name: `${formatEmoji("1225771865092526151")} Reason of closing:`,
              value:
                ticket.closeReason.length === 0
                  ? "No reason"
                  : ticket.closeReason,
              inline: true,
            },
          ])
          .setColor(Colors.Green)
          .setTimestamp();
        const button =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setLabel("View transcript")
              .setStyle(ButtonStyle.Link)
              .setURL(transcriptBin.url)
          );
        await channel.send({
          embeds: [embed],
          components: [button],
        });
        const user = await interaction.client.users.fetch(ticket.author);
        try {
          await user.send({
            embeds: [
              embed.setAuthor({
                name: interaction.guild!.name,
                iconURL: interaction.guild!.iconURL() as string,
              }),
            ],
            components: [button],
          });
        } catch (err) {
          console.log(err);
        }
        await interaction.channel?.delete();
        await schema.update(schema.raw);
      }
    }
    if (interaction.isAutocomplete()) {
      if (
        interaction.options.data.find(
          (option) =>
            option.name === "color" ||
            option.options?.find((opt) => opt.name === "color")
        )
      ) {
        await handleColorAutocomplete(interaction);
      }
      if (
        interaction.options.data.find((option) =>
          option.options?.find((opt) => opt.name === "trigger")
        )
      ) {
        const focused = interaction.options.getFocused();
        const autoResponsesSchema = await AutoResponsesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!autoResponsesSchema) return;
        const filtered = autoResponsesSchema.raw.autoResponses.filter(
          (autoResponse) => autoResponse.trigger.startsWith(focused)
        );
        await interaction.respond(
          filtered.slice(0, 25).map((autoResponse) => ({
            name: autoResponse.trigger,
            value: autoResponse.trigger,
          }))
        );
      }
      if (
        interaction.options.data.find((option) =>
          option.options?.find((opt) => opt.name === "warn-id")
        )
      ) {
        const focused = interaction.options.getFocused();
        const warnsSchema = await WarnsSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!warnsSchema) return;
        const filteredWarns = warnsSchema.raw.warns.filter((warn) =>
          warn.id.startsWith(focused)
        );
        await interaction.respond(
          filteredWarns.slice(0, 25).map((warn) => ({
            name: `${warn.id} - (${
              warn.reason.length > 85
                ? `${warn.reason.slice(0, 85)}...`
                : warn.reason
            })`,
            value: warn.id,
          }))
        );
      }
      if (
        interaction.options.data.find((option) =>
          option.options?.find((opt) => opt.name === "event")
        )
      ) {
        await interaction.respond(
          Object.values(EventsEnum)
            .filter((event) =>
              camelCaseToWords(event).startsWith(
                interaction.options.getFocused()
              )
            )
            .slice(0, 25)
            .map((event) => ({
              name: camelCaseToWords(event),
              value: event,
            }))
        );
      }
    }
  }
}

function checkPermission(
  interaction: ButtonInteraction,
  ticketsSchema: TicketsSchema
): boolean {
  let status: boolean = false;
  if (ticketsSchema) {
    if (
      ticketsSchema.raw.userSupportMembers.length != 0 &&
      ticketsSchema.raw.userSupportMembers.includes(interaction.user.id)
    )
      status = true;
    if (
      ticketsSchema.raw.roleSupportMembers.length != 0 &&
      (interaction.member as GuildMember).roles.cache.hasAny(
        ...ticketsSchema.raw.roleSupportMembers
      )
    )
      status = true;
  } else if (interaction.guild!.ownerId === interaction.user.id) status = true;
  else status = false;
  return status;
}
