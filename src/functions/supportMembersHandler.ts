import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  RoleSelectMenuBuilder,
  Snowflake,
  UserSelectMenuBuilder,
  formatEmoji,
  ButtonInteraction,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";

export async function supportMembersHandler(
  interaction: ChatInputCommandInteraction,
  ticketsSchema: TicketsSchema | null,
  handleSubmit: (
    i: ButtonInteraction,
    ticketSchema: TicketsSchema | null,
    roles: Snowflake[],
    users: Snowflake[]
  ) => any
) {
  let users: Snowflake[] = [];
  let roles: Snowflake[] = [];

  const roleSelectMenu = new RoleSelectMenuBuilder()
    .setCustomId("roles")
    .setMaxValues(interaction.guild!.roles.cache.size)
    .setPlaceholder("Select roles here")
    .setMinValues(0);
  const userSelectMenu = new UserSelectMenuBuilder()
    .setCustomId("users")
    .setMaxValues(interaction.guild!.memberCount)
    .setPlaceholder("Select users here")
    .setMinValues(0);
  if (ticketsSchema) {
    if (ticketsSchema.raw.roleSupportMembers)
      roleSelectMenu.setDefaultRoles(ticketsSchema.raw.roleSupportMembers);
    if (ticketsSchema.raw.userSupportMembers)
      userSelectMenu.setDefaultUsers(ticketsSchema.raw.userSupportMembers);
  }
  const embed = new EmbedBuilder()
    .setTitle("Set ticket support representatives")
    .setDescription(
      `Interact with the dropdown menus below to start selecting roles and users that will be set as ticket support representatives in this server.\n\nSelecting these roles/users will allow them to view tickets and claim them.\n\nRoles/Users who are already set as support representatives will by default be selected in the dropdown menu. De-selecting them will remove them from being support representatives.\n\nOnce you're done selecting your roles/users, click the \`Confirm\` button to save.\n\nIf you wish to cancel this action, click the \`Cancel\` button.`
    )
    .setColor(Colors.Blue);
  const message = await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        roleSelectMenu
      ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        userSelectMenu
      ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("confirm")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  });

  const collector = message.createMessageComponentCollector({
    time: 600000,
  });

  collector.on("collect", async (i) => {
    if (i.isRoleSelectMenu()) {
      roles = i.values;
      i.update({
        embeds: [embed],
      });
    }
    if (i.isUserSelectMenu()) {
      users = i.values;
      i.update({
        embeds: [embed],
      });
    }
    if (i.isButton()) {
      if (i.customId == "cancel") {
        collector.stop("cancelled");
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setDescription("This action has been cancelled!")
              .setColor(Colors.Red),
          ],
          components: [],
        });
      } else if (i.customId == "confirm") {
        handleSubmit(i, ticketsSchema, roles, users);
      }
    }
  });

  collector.on("end", async (_c, reason) => {
    if (reason == "confirmed" || reason == "cancelled") return;
    try {
      await message.edit({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You have exceeded the 10 mins timeout. No data has been saved\n\nPlease re-run the command to select roles/users as support representatives.`
            )
            .setColor(Colors.Red),
        ],
        components: [],
      });
    } catch (err) {}
  });
  return {
    users,
    roles,
  };
}
