import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ChannelType,
  ColorResolvable,
  Colors,
  EmbedBuilder,
  Message,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  channelMention,
  formatEmoji,
} from "discord.js";
import {
  StickyMessages,
  StickyMessagesSchema,
} from "../schemas/StickyMessages";

export class StickyMessagesCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("sticky-messages")
        .setDescription("Manage sticky messages in this server")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Adds a sticky message to this server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("The channel to send the sticky message to")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addBooleanOption((option) =>
              option
                .setName("embed")
                .setDescription(
                  "Choose whether the sticky message will be an embed or not"
                )
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("color")
                .setDescription(
                  "Choose a color to set for the embed (only applicable if embed is true)"
                )
                .setAutocomplete(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Removes a sticky message from this server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("The channel to remove the sticky message from")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
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
        const channel = interaction.options.getChannel(
          "channel",
          true
        ) as TextChannel;
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
        const schema = await StickyMessagesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (
          schema &&
          schema.raw.stickyMessages.find(
            (stickyMessage) => stickyMessage.channel === channel.id
          )
        )
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The channel you have selected already contains a sticky message!`
                )
                .setColor(Colors.Red),
            ],
          });
        const messageActionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("message")
              .setLabel("Provide the sticky message here:")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        const embedActionRow1 =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("title")
              .setLabel("Provide the title for the embed")
              .setRequired(false)
              .setStyle(TextInputStyle.Short)
              .setMaxLength(256)
          );
        const embedActionRow2 =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("description")
              .setLabel("Provide the Description for the embed")
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        const modal = new ModalBuilder()
          .setTitle("Sticky Message")
          .setCustomId("stickyMessageModal");
        isEmbed
          ? modal.setComponents(embedActionRow1, embedActionRow2)
          : modal.setComponents(messageActionRow);
        await interaction.showModal(modal);
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 600000,
        });
        await modalInteraction.deferReply({
          ephemeral: true,
        });
        let message: Message;
        let title: string = "";
        let description: string = "";
        let content: string = "";
        if (isEmbed) {
          title = modalInteraction.fields.getTextInputValue("title");
          description =
            modalInteraction.fields.getTextInputValue("description");
          const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(color as ColorResolvable);
          if (title.length > 0) embed.setTitle(title);
          message = await channel.send({
            embeds: [embed],
          });
        } else {
          content = modalInteraction.fields.getTextInputValue("message");
          message = await channel.send({
            content,
          });
        }
        const dataToSave: StickyMessages = {
          channel: channel.id,
          message: message.id,
          isEmbed,
        };
        if (isEmbed)
          dataToSave.embedData = {
            title,
            description,
            color,
          };
        if (!isEmbed) dataToSave.content = content;
        if (schema) {
          schema.raw.stickyMessages.push(dataToSave);
          await schema.update(schema.raw);
        } else {
          await StickyMessagesSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            stickyMessages: [dataToSave],
          });
        }
        modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | A sticky message have been successfully sent to the channel ${channelMention(
                  channel.id
                )}!`
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
        const channel = interaction.options.getChannel(
          "channel",
          true
        ) as TextChannel;
        const schema = await StickyMessagesSchema.find(
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
                  )} | There are no sticky messages set in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const stickyMessage = schema.raw.stickyMessages.find(
          (data) => data.channel === channel.id
        );
        if (!stickyMessage)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The channel specified does not contain a sticky message!`
                )
                .setColor(Colors.Red),
            ],
          });
        try {
          await (await channel.messages.fetch(stickyMessage.message)).delete();
        } catch (err) {}
        const index = schema.raw.stickyMessages.indexOf(stickyMessage);
        schema.raw.stickyMessages.splice(index, 1);
        await schema.update(schema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | The sticky message have been removed from ${channelMention(
                  channel.id
                )}!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
    }
  }
}
