import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  PermissionsBitField,
  RoleSelectMenuBuilder,
  Snowflake,
  formatEmoji,
} from "discord.js";
import { StaffMembersSchema } from "../schemas/StaffMembers";
export class SetStaffMembersCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-staff-members")
        .setDescription("Sets roles as staff members in this server")
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
    const schema = await StaffMembersSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    const message = await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription("Select a command to manage staff roles to:")
          .setColor(Colors.Blue),
      ],
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setLabel("Warns")
            .setCustomId("warns")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel("Notes")
            .setCustomId("notes")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });
    const collector = await message.awaitMessageComponent({
      time: 600000,
      componentType: ComponentType.Button,
    });
    switch (collector.customId) {
      case "warns": {
        await addRoles(collector, schema);
        break;
      }
      case "notes": {
        await addRoles(collector, schema);
        break;
      }
    }
  }
}

const addRoles = async (
  interaction: ButtonInteraction,
  schema: StaffMembersSchema | null
) => {
  const { customId } = interaction;
  const selectMenu = new RoleSelectMenuBuilder()
    .setCustomId("roleSelectMenu")
    .setMinValues(1)
    .setMaxValues((await interaction.guild!.roles.fetch()).size)
    .setPlaceholder("Select roles here");
  if (schema) {
    if (customId === "warns") selectMenu.setDefaultRoles(schema.raw.forWarns);
    else if (customId === "notes")
      selectMenu.setDefaultRoles(schema.raw.forNotes);
  }
  const embed = new EmbedBuilder()
    .setDescription(
      `Interact with the select menu below to select roles that will have the privilege to **add, view and remove ${
        customId === "warns" ? "warns" : "notes"
      } from server members**\n\nRoles who have already been set are automatically selected in the select menu, and de-selecting them will remove their privileges\n\nAfter making changes, press on the \`confirm\` button to save them.\nIf you wish to cancel without saving anything, press \`cancel\`.`
    )
    .setColor(Colors.Blue);
  const updatedMessage = await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        selectMenu
      ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setLabel("Confirm")
          .setCustomId("confirm")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel("Cancel")
          .setCustomId("cancel")
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  });
  const collector = updatedMessage.createMessageComponentCollector({
    time: 600000,
  });
  let roles: Snowflake[] = [];
  collector.on("collect", async (i) => {
    if (i.isRoleSelectMenu()) {
      roles = i.values;
      i.update({
        embeds: [embed],
      });
    }
    if (i.isButton()) {
      if (i.customId === "confirm") {
        collector.stop("confirmed");
        if (schema) {
          customId === "warns"
            ? (schema.raw.forWarns = roles)
            : (schema.raw.forNotes = roles);
          await schema.update(schema.raw);
        } else
          await StaffMembersSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            forNotes: customId === "notes" ? roles : [],
            forWarns: customId === "warns" ? roles : [],
          });
        i.update({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | Roles have been updated successfully!`
              )
              .setColor(Colors.Green),
          ],
          components: [],
        });
      } else if (i.customId === "cancel") {
        collector.stop("cancelled");
        i.update({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221828309743046677",
                  true
                )} | This action has been cancelled!`
              )
              .setColor(Colors.Red),
          ],
          components: [],
        });
      }
    }
  });
  collector.on("end", (_c, reason) => {
    if (["confirmed", "cancelled"].includes(reason)) return;
    interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("Timeout!")
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | This action has been cancelled!`
          )
          .setColor(Colors.Red),
      ],
      components: [],
    });
  });
};
