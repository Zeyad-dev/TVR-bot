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
import { TimedMessage, TimedMessagesSchema } from "../schemas/TimedMessages";
import { timeToMilliseconds } from "../functions/timeToMS";

export class TimeMessagesCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("timed-message")
        .setDescription("Manage timed messages in this server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("adds a timed message to this server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription(
                  "The channel this timed message will be sent to"
                )
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addBooleanOption((option) =>
              option
                .setName("embed")
                .setDescription("Whether the message will be an embed or not")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("interval")
                .setDescription(
                  "The interval time. Use this format: 1w/1d/1h/1m. Make sure to separated them by spaces."
                )
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
            .setDescription("edit a timed message that exists in this server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription(
                  "The channel where this timed message is set to"
                )
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addStringOption((option) =>
              option
                .setName("interval")
                .setDescription(
                  "The interval time. Use this format: 1w/1d/1h/1m. Make sure to separated them by spaces."
                )
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("removes a timed message from this server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription(
                  "The channel where this timed message is set to"
                )
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
        const color = interaction.options.getString("color") || "Default";
        const channel = interaction.options.getChannel(
          "channel",
          true
        ) as TextChannel;
        const interval = timeToMilliseconds(
          interaction.options.getString("interval", true)
        );
        if (!interval)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The interval provided is invalid! Please make sure to follow the below syntax:\n\n\`(number)w\` for weeks, example: \`2w\` for 2 weeks\n\`(number)d\` for days, example: \`5d\` for 5 days\n\`(number)h\` for hours, example: \`1h\` for 1 hour\n\`(number)m\` for minutes, example: \`20m\` for 20 minutes`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
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
        const schema = await TimedMessagesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (
          schema &&
          schema.raw.timedMessages.find(
            (timedMessage) => timedMessage.channel === channel.id
          )
        )
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | A timed message already exists in that channel!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const contentInput =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("content")
              .setLabel("Set the timed message content here:")
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
          .setTitle("Make a new timed message")
          .setCustomId("timedMessageModal");
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
        let title: string = "";
        let description: string = "";
        let content: string = "";
        let data: TimedMessage;
        let message: Message;
        if (isEmbed) {
          title = modalInteraction.fields.getTextInputValue("title");
          description =
            modalInteraction.fields.getTextInputValue("description");
          const embed = new EmbedBuilder()
            .setColor(color as ColorResolvable)
            .setDescription(description);
          if (title) embed.setTitle(title);
          message = await channel.send({
            embeds: [embed],
          });
          data = {
            channel: channel.id,
            isEmbed,
            message: message.id,
            interval,
            lastSendTime: Date.now(),
            embeds: {
              title,
              description,
              color,
            },
          };
        } else {
          content = modalInteraction.fields.getTextInputValue("content");
          message = await channel.send({
            content,
          });
          data = {
            channel: channel.id,
            interval,
            message: message.id,
            isEmbed,
            content,
            lastSendTime: Date.now(),
          };
        }
        if (schema) {
          schema.raw.timedMessages.push(data);
          await schema.update(schema.raw);
        } else
          await TimedMessagesSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            timedMessages: [data],
          });

        await modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | An timed message has been created successfully in ${channelMention(
                  channel.id
                )}!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "edit": {
        const schema = await TimedMessagesSchema.find(
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
                  )} | There are no timed messages set up on this server!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const channel = interaction.options.getChannel("channel", true);
        const interval = timeToMilliseconds(
          interaction.options.getString("interval", true)
        );
        if (!interval)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The interval provided is invalid! Please make sure to follow the below syntax:\n\n\`(number)w\` for weeks, example: \`2w\` for 2 weeks\n\`(number)d\` for days, example: \`5d\` for 5 days\n\`(number)h\` for hours, example: \`1h\` for 1 hour\n\`(number)m\` for minutes, example: \`20m\` for 20 minutes`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        let timedMessage = schema.raw.timedMessages.find(
          (data) => data.channel === channel.id
        );
        if (!timedMessage)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no timed message set in the channel you provided!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const modal = new ModalBuilder()
          .setTitle("Edit a timed message")
          .setCustomId("editTimedMessage");
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
        if (timedMessage.embeds) {
          if (timedMessage.embeds.title)
            titleActionRow.components[0].setValue(timedMessage.embeds.title);
          descriptionActionRow.components[0].setValue(
            timedMessage.embeds.description
          );
        }
        const contentActionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("content")
              .setLabel("Edit the timed message content here:")
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(4000)
          );
        if (timedMessage.content)
          contentActionRow.components[0].setValue(timedMessage.content);
        timedMessage.isEmbed
          ? modal.addComponents(titleActionRow, descriptionActionRow)
          : modal.addComponents(contentActionRow);
        await interaction.showModal(modal);
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 600000,
        });
        await modalInteraction.deferReply({
          ephemeral: true,
        });
        let title: string = "";
        let description: string = "";
        let content: string = "";
        let data: TimedMessage;
        if (timedMessage.isEmbed) {
          title = modalInteraction.fields.getTextInputValue("title");
          description =
            modalInteraction.fields.getTextInputValue("description");
          data = {
            channel: timedMessage.channel,
            lastSendTime: timedMessage.lastSendTime,
            message: timedMessage.message,
            interval: interval,
            isEmbed: timedMessage.isEmbed,
            embeds: {
              title,
              description,
              color: timedMessage.embeds!.color,
            },
          };
        } else {
          content = modalInteraction.fields.getTextInputValue("content");
          data = {
            channel: timedMessage.channel,
            lastSendTime: timedMessage.lastSendTime,
            message: timedMessage.message,
            interval: interval,
            isEmbed: timedMessage.isEmbed,
            content,
          };
        }
        timedMessage = Object.assign(timedMessage, data);
        await schema.update(schema.raw);
        await modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | This timed message has been updated successfully!`
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
        const schema = await TimedMessagesSchema.find(
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
                  )} | There are no timed messages set up on this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const channel = interaction.options.getChannel("channel", true);
        const timedMessage = schema.raw.timedMessages.find(
          (data) => data.channel === channel.id
        );
        if (!timedMessage)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no timed message with the channel provided!`
                )
                .setColor(Colors.Red),
            ],
          });
        schema.raw.timedMessages.splice(
          schema.raw.timedMessages.indexOf(timedMessage),
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
                )} | This timed message has been successfully deleted!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
    }
  }
}
