import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
  formatEmoji,
} from "discord.js";
import { AutoResponses, AutoResponsesSchema } from "../schemas/AutoResponses";

export class AutoResponsesCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("auto-responses")
        .setDescription("Manage auto-responses in this server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("adds an auto-response to this server")
            .addBooleanOption((option) =>
              option
                .setName("embed")
                .setDescription("Whether the response will be an embed or not")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("color")
                .setDescription(
                  "The color of the embed (applicable if embed is true)"
                )
                .setAutocomplete(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("edit")
            .setDescription("edit an auto-response that exists in this server")
            .addStringOption((option) =>
              option
                .setName("trigger")
                .setDescription("The trigger of the auto-response to edit")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("removes an auto-response from this server")
            .addStringOption((option) =>
              option
                .setName("trigger")
                .setDescription("The trigger of the auto-response to edit")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    switch (interaction.options.getSubcommand()) {
      case "add": {
        const isEmbed = interaction.options.getBoolean("embed", true);
        const color = interaction.options.getString("color") || "Default";
        if (
          !Object.keys(Colors).includes(color) &&
          !/^#[0-9A-F]{6}$/i.test(color)
        )
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The color you have specified is invalid!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const triggerInput =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("trigger")
              .setLabel("Set the trigger for this auto-response")
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          );
        const contentInput =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("content")
              .setLabel("Set it's response here:")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        const embedTitleInput =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("title")
              .setLabel("Set the title for the embed")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(256)
              .setRequired(false)
          );
        const embedDescriptionInput =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("description")
              .setLabel("Set the description for the embed")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        const modal = new ModalBuilder()
          .setTitle("Make a new auto-response")
          .setCustomId("autoResponseModal")
          .addComponents(triggerInput);
        isEmbed
          ? modal.addComponents(embedTitleInput, embedDescriptionInput)
          : modal.addComponents(contentInput);
        await interaction.showModal(modal);
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 600000,
        });
        await modalInteraction.deferReply({
          ephemeral: true,
        });
        const trigger = modalInteraction.fields.getTextInputValue("trigger");
        let title: string = "";
        let description: string = "";
        let content: string = "";
        let data: AutoResponses;
        const schema = await AutoResponsesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (
          schema &&
          schema.raw.autoResponses.find(
            (autoResponse) => autoResponse.trigger === trigger
          )
        )
          return modalInteraction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | An auto-response with the same trigger already exists! If you wish to edit that one, use </auto-responses edit:1227286490095157249>`
                )
                .setColor(Colors.Red),
            ],
          });
        if (isEmbed) {
          title = modalInteraction.fields.getTextInputValue("title");
          description =
            modalInteraction.fields.getTextInputValue("description");
          data = {
            trigger,
            isEmbed,
            embeds: {
              title,
              description,
              color,
            },
          };
        } else {
          content = modalInteraction.fields.getTextInputValue("content");
          data = {
            trigger,
            isEmbed,
            content,
          };
        }
        if (schema) {
          schema.raw.autoResponses.push(data);
          await schema.update(schema.raw);
        } else
          await AutoResponsesSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            autoResponses: [data],
          });

        await modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | An auto-response with the trigger \`${trigger}\` has been created successfully!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "edit": {
        const schema = await AutoResponsesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!schema)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no auto-responses set up on this server!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const trigger = interaction.options.getString("trigger", true);
        let autoResponse = schema.raw.autoResponses.find(
          (data) => data.trigger === trigger
        );
        if (!autoResponse)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no auto-response with the trigger you provided!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const modal = new ModalBuilder()
          .setTitle("Edit an auto-response")
          .setCustomId("editAutoResponse")
          .addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
              new TextInputBuilder()
                .setCustomId("trigger")
                .setLabel("Edit the trigger")
                .setStyle(TextInputStyle.Short)
                .setValue(autoResponse.trigger)
            )
          );
        const titleActionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("title")
              .setLabel("Edit the embed's title")
              .setStyle(TextInputStyle.Short)
              .setMaxLength(256)
          );

        const descriptionActionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("description")
              .setLabel("Edit the embed's description")
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        if (autoResponse.embeds) {
          if(autoResponse.embeds.title) titleActionRow.components[0].setValue(autoResponse.embeds.title);
          descriptionActionRow.components[0].setValue(
            autoResponse.embeds.description
          );
        }
        const contentActionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("content")
              .setLabel("Edit it's response here:")
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        if (autoResponse.content)
          contentActionRow.components[0].setValue(autoResponse.content);
        autoResponse.isEmbed
          ? modal.addComponents(titleActionRow, descriptionActionRow)
          : modal.addComponents(contentActionRow);
        await interaction.showModal(modal);
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 600000,
        });
        await modalInteraction.deferReply({
          ephemeral: true,
        });
        const newTrigger = modalInteraction.fields.getTextInputValue("trigger");
        let title: string = "";
        let description: string = "";
        let content: string = "";
        let data: AutoResponses;
        if (autoResponse.isEmbed) {
          title = modalInteraction.fields.getTextInputValue("title");
          description =
            modalInteraction.fields.getTextInputValue("description");
          data = {
            trigger: newTrigger,
            isEmbed: autoResponse.isEmbed,
            embeds: {
              title,
              description,
              color: autoResponse.embeds!.color,
            },
          };
        } else {
          content = modalInteraction.fields.getTextInputValue("content");
          data = {
            trigger: newTrigger,
            isEmbed: autoResponse.isEmbed,
            content,
          };
        }
        autoResponse = Object.assign(autoResponse, data);
        await schema.update(schema.raw);
        await modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | This auto-response has been updated successfully!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "remove": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const schema = await AutoResponsesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!schema)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no auto-responses set up on this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const trigger = interaction.options.getString("trigger", true);
        const autoResponse = schema.raw.autoResponses.find(
          (data) => data.trigger === trigger
        );
        if (!autoResponse)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no auto-response with the trigger you provided!`
                )
                .setColor(Colors.Red),
            ],
          });
        schema.raw.autoResponses.splice(
          schema.raw.autoResponses.indexOf(autoResponse),
          1
        );
        await schema.update(schema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | This auto-response has been successfully deleted!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
    }
  }
}
