import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Colors,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  PermissionsBitField,
  TextChannel,
  channelMention,
  formatEmoji,
} from "discord.js";
import { LogsSchema, EventsEnum, logs } from "../schemas/Logs";
import { camelCaseToWords } from "../functions/camelCaseToWords";

export class LoggingCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("logging")
        .setDescription("Manage logging in this server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((option) =>
          option
            .setName("setup")
            .setDescription(
              "Creates and assigns channels for different logging events"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("channels")
            .setDescription("Set channels for different logging events.")
            .addStringOption((option) =>
              option
                .setName("event")
                .setDescription("The event to set the channel to")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("The channel to send the logs to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand((option) =>
          option
            .setName("toggle")
            .setDescription("Toggle events on or off")
            .addStringOption((option) =>
              option
                .setName("event")
                .setDescription("The event to toggle on or off")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("status")
                .setDescription("Whether the event should toggled on or off")
                .setChoices(
                  {
                    name: "On",
                    value: "on",
                  },
                  {
                    name: "Off",
                    value: "off",
                  }
                )
                .setRequired(true)
            )
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    switch (interaction.options.getSubcommand()) {
      case "setup": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const schema = await LogsSchema.find(
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
                  )} | A logging system has already been set up in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const category = await interaction.guild!.channels.create({
          name: "Logging",
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild!.roles.everyone.id,
              deny: PermissionsBitField.Flags.ViewChannel,
            },
          ],
          position: 999,
        });
        const channelLogging = await interaction.guild!.channels.create({
          name: "channels",
          type: ChannelType.GuildText,
          parent: category,
        });
        const membersLogging = await interaction.guild!.channels.create({
          name: "members",
          type: ChannelType.GuildText,
          parent: category,
        });
        const guildLogging = await interaction.guild!.channels.create({
          name: "server",
          type: ChannelType.GuildText,
          parent: category,
        });
        const messagesLogging = await interaction.guild!.channels.create({
          name: "messages",
          type: ChannelType.GuildText,
          parent: category,
        });
        const logs: logs = {} as logs;
        channelEvents.forEach((event) => {
          logs[event] = {
            channel: channelLogging.id,
            toggled: true,
          };
        });
        memberEvents.forEach((event) => {
          logs[event] = {
            channel: membersLogging.id,
            toggled: true,
          };
        });
        guildEvents.forEach((event) => {
          logs[event] = {
            channel: guildLogging.id,
            toggled: true,
          };
        });
        messageEvents.forEach((event) => {
          logs[event] = {
            channel: messagesLogging.id,
            toggled: true,
          };
        });
        await LogsSchema.create(interaction.client, {
          guildId: interaction.guild!.id,
          logs,
        });
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | Logging has been successfully initialized in this server!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "channels": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const event = interaction.options.getString("event", true);
        const channel = interaction.options.getChannel(
          "channel",
          true
        ) as TextChannel;
        const schema = await LogsSchema.find(
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
                  )} | A logging system hasn't been set up in this server yet! Please run </logging setup:1229014002261037057> first!`
                )
                .setColor(Colors.Red),
            ],
          });
        if (!Object.values(EventsEnum).includes(event as EventsEnum))
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The event you have specified is not valid!`
                )
                .setColor(Colors.Red),
            ],
          });
        schema.raw.logs[event as EventsEnum].channel = channel.id;
        await schema.update(schema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | Logs for \`${camelCaseToWords(
                  event
                )}\` will now be sent to ${channelMention(channel.id)}!`
              )
              .setColor(Colors.Green),
          ],
        });
        const message = await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Would you also like to set ${channelMention(
                  channel.id
                )} for all related events to \`${camelCaseToWords(event)}\`?`
              )
              .setColor(Colors.Blue),
          ],
          components: [
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("yes")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("no")
                .setLabel("No")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
          ephemeral: true,
        });
        const collector = await message.awaitMessageComponent({
          time: 600000,
          componentType: ComponentType.Button,
        });
        if (collector.customId === "yes") {
          if (channelEvents.includes(event as EventsEnum)) {
            channelEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].channel = channel.id;
            });
          }
          if (guildEvents.includes(event as EventsEnum)) {
            guildEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].channel = channel.id;
            });
          }
          if (memberEvents.includes(event as EventsEnum)) {
            memberEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].channel = channel.id;
            });
          }
          if (messageEvents.includes(event as EventsEnum)) {
            messageEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].channel = channel.id;
            });
          }
          await schema.update(schema.raw);
          await collector.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221897469592600677",
                    true
                  )} | ${channelMention(
                    channel.id
                  )} has been set to be the logging channel for the event \`${camelCaseToWords(
                    event
                  )}\` and it's related events!`
                )
                .setColor(Colors.Green),
            ],
            components: [],
          });
        } else if (collector.customId === "no") {
          return collector.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | ${channelMention(
                    channel.id
                  )} won't be used for events related to ${camelCaseToWords(
                    event
                  )}!`
                )
                .setColor(Colors.Red),
            ],
            components: [],
          });
        }
        break;
      }
      case "toggle": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const event = interaction.options.getString("event", true);
        const toggled =
          interaction.options.getString("status", true) === "on" ? true : false;
        const schema = await LogsSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!Object.values(EventsEnum).includes(event as EventsEnum))
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | The event you have specified is not valid!`
                )
                .setColor(Colors.Red),
            ],
          });
        if (!schema)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | A logging system hasn't been set up in this server yet! Please run </logging setup:1229014002261037057> first!`
                )
                .setColor(Colors.Red),
            ],
          });
        schema.raw.logs[event as EventsEnum].toggled = toggled;
        await schema.update(schema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | Logs for \`${camelCaseToWords(event)}\` are now **${
                  toggled ? "enabled" : "disabled"
                }**!`
              )
              .setColor(Colors.Green),
          ],
        });
        const message = await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `Would you also like to set all related events to \`${camelCaseToWords(
                  event
                )}\` to be **${toggled ? "enabled" : "disabled"}**?`
              )
              .setColor(Colors.Blue),
          ],
          components: [
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("yes")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("no")
                .setLabel("No")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
          ephemeral: true,
        });
        const collector = await message.awaitMessageComponent({
          time: 600000,
          componentType: ComponentType.Button,
        });
        if (collector.customId === "yes") {
          if (channelEvents.includes(event as EventsEnum)) {
            channelEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].toggled = toggled;
            });
          }
          if (guildEvents.includes(event as EventsEnum)) {
            guildEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].toggled = toggled;
            });
          }
          if (memberEvents.includes(event as EventsEnum)) {
            memberEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].toggled = toggled;
            });
          }
          if (messageEvents.includes(event as EventsEnum)) {
            messageEvents.forEach((e) => {
              schema.raw.logs[e as EventsEnum].toggled = toggled;
            });
          }
          await schema.update(schema.raw);
          await collector.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221897469592600677",
                    true
                  )} | The event \`${camelCaseToWords(
                    event
                  )}\` and it's related events have been successfully set as **${
                    toggled ? "enabled" : "disabled"
                  }**!`
                )
                .setColor(Colors.Green),
            ],
            components: [],
          });
        } else if (collector.customId === "no") {
          return collector.update({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | Events related to ${camelCaseToWords(
                    event
                  )} won't be set as **${toggled ? "enabled" : "disabled"}**!`
                )
                .setColor(Colors.Red),
            ],
            components: [],
          });
        }
        break;
      }
    }
  }
}

const channelEvents = [
  EventsEnum.ChannelCreate,
  EventsEnum.ChannelDelete,
  EventsEnum.ChannelPinsUpdate,
  EventsEnum.ChannelUpdate,
  EventsEnum.ThreadCreate,
  EventsEnum.ThreadDelete,
  EventsEnum.ThreadUpdate,
];
const memberEvents = [
  EventsEnum.GuildBanAdd,
  EventsEnum.GuildBanRemove,
  EventsEnum.GuildMemberRemove,
  EventsEnum.GuildMemberRemove,
  EventsEnum.GuildMemberUpdate,
  EventsEnum.UserUpdate,
];
const guildEvents = [
  EventsEnum.GuildEmojiCreate,
  EventsEnum.GuildEmojiDelete,
  EventsEnum.GuildEmojiUpdate,
  EventsEnum.GuildRoleCreate,
  EventsEnum.GuildRoleDelete,
  EventsEnum.GuildRoleUpdate,
  EventsEnum.GuildStickerCreate,
  EventsEnum.GuildStickerDelete,
  EventsEnum.GuildStickerUpdate,
  EventsEnum.GuildUpdate,
  EventsEnum.WebhooksUpdate,
];
const messageEvents = [
  EventsEnum.MessageBulkDelete,
  EventsEnum.MessageDelete,
  EventsEnum.MessageUpdate,
];
