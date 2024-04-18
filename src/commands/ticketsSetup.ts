import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelType,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  PermissionsBitField,
  Snowflake,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  formatEmoji,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";
import { supportMembersHandler } from "../functions/supportMembersHandler";

export class TicketsSetupCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("tickets-setup")
        .setDescription("Initiate the ticket setup process.")
        .setDMPermission(false)
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "The channel which the ticket dropdown selection message will be sent to"
            )
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName("transcript-channel")
            .setDescription("The channel to send ticket transcripts to")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("The category where tickets will open in")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
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
    const schema = await TicketsSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (schema)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You cannot setup a new ticket system in this server as one already exists!`
            )
            .setColor(Colors.Red),
        ],
      });
    const channel = interaction.options.getChannel(
      "channel",
      true
    ) as TextChannel;
    const category = interaction.options.getChannel("category", true).id;
    const transcriptChannel = interaction.options.getChannel(
      "transcript-channel",
      true
    ).id;
    const handleSubmit = (
      i: ButtonInteraction,
      _ticketSchema: TicketsSchema | null,
      roles: Snowflake[],
      users: Snowflake[]
    ) => {
      i.update({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221897469592600677",
                true
              )} | The ticket system has successfully been initiated in this server!`
            )
            .setColor(Colors.Green),
        ],
        components: [],
      }).then(async () => {
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
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              [
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
              ]
            ),
          ],
        });
        await TicketsSchema.create(interaction.client, {
          ticketSelectionMessage: {
            channelId: channel.id,
            id: message.id,
          },
          category,
          userSupportMembers: users,
          roleSupportMembers: roles,
          guildId: interaction.guild!.id,
          tickets: [],
          ticketsCount: 0,
          transcriptChannel,
        });
      });
    };
    return await supportMembersHandler(interaction, schema, handleSubmit);
  }
}
