import { Command } from "@sapphire/framework";
import { StaffMembersSchema } from "../schemas/StaffMembers";
import {
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonComponent,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  GuildMember,
  InteractionEditReplyOptions,
  Message,
  MessageActionRowComponentBuilder,
  formatEmoji,
  time,
  userMention,
} from "discord.js";
import { Warns, WarnsSchema } from "../schemas/Warns";
import { generateString } from "../functions/generateRandomString";

export class WarnsCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("warns")
        .setDescription("Manage warns in this server (Add/Remove/View)")
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Adds a warn for the specified user")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to warn")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("Reason for the warn (context)")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription(
              "Removes a warn that corresponds to the specified warn id."
            )
            .addStringOption((option) =>
              option
                .setName("warn-id")
                .setDescription("The id of the warn to remove")
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("view")
            .setDescription("View warns in this server")
            .addStringOption((option) =>
              option
                .setName("filter-id")
                .setDescription("The id of the warn to view")
            )
            .addUserOption((option) =>
              option
                .setName("filter-user")
                .setDescription("The user to view warns of")
            )
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply({
      ephemeral: true,
    });
    const staffMembersSchema = await StaffMembersSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (!staffMembersSchema || staffMembersSchema.raw.forWarns.length === 0)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | No staff members have been assigned to have the privilege to warn!`
            )
            .setColor(Colors.Red),
        ],
      });
    if (
      !(interaction.member as GuildMember).roles.cache.hasAny(
        ...staffMembersSchema.raw.forWarns
      ) &&
      interaction.guild!.ownerId != interaction.user.id
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | You don't have the permission to use this command!`
            )
            .setColor(Colors.Red),
        ],
      });
    switch (interaction.options.getSubcommand()) {
      case "add": {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        if (interaction.user.id === user.id)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | You can not warn yourself!`
                )
                .setColor(Colors.Red),
            ],
          });
        let memberToWarn: GuildMember;
        try {
          memberToWarn = await interaction.guild!.members.fetch(user);
        } catch (err) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | Please specify a valid user in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        }
        const member = await interaction.guild!.members.fetch(interaction.user);
        if (
          member.roles.highest.comparePositionTo(memberToWarn.roles.highest) <
            0 &&
          interaction.guild!.ownerId != interaction.user.id
        )
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | You do not have the permissions to warn this user!`
                )
                .setColor(Colors.Red),
            ],
          });
        const warnsSchema = await WarnsSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        let id = generateString(6);
        if (warnsSchema) {
          while (warnsSchema.raw.warns.find((warn) => warn.id === id)) {
            id = generateString(6);
          }
        }
        const data = {
          userId: user.id,
          warner: interaction.user.id,
          reason,
          warnedAt: Date.now(),
          id,
        };
        if (warnsSchema) {
          warnsSchema.raw.warns.push(data);
          await warnsSchema.update(warnsSchema.raw);
        } else {
          await WarnsSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            warns: [data],
          });
        }
        const totalWarns = (await WarnsSchema.find(
          interaction.client,
          interaction.guild!.id
        ))!.raw.warns.filter((warns) => warns.userId === user.id).length;
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji("1221897469592600677", true)} | ${userMention(
                  user.id
                )} has been warned successfully!`
              )
              .setFields(
                {
                  name: "Reason:",
                  value: reason,
                  inline: true,
                },
                {
                  name: "Warn ID:",
                  value: id,
                  inline: true,
                }
              )
              .setFooter({
                text: `This user now has a total of ${
                  totalWarns === 1
                    ? `${totalWarns} warn`
                    : `${totalWarns} warns`
                }`,
              })
              .setColor(Colors.Green),
          ],
        });
        try {
          await user.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `You have been warned in **${interaction.guild!.name}**!`
                )
                .setFields([
                  {
                    name: "Warned by:",
                    value: `${interaction.user.username} (${interaction.user.id})`,
                    inline: true,
                  },
                  {
                    name: "Reason:",
                    value: reason,
                    inline: true,
                  },
                  {
                    name: "Warn ID:",
                    value: id,
                    inline: true,
                  },
                ])
                .setFooter({
                  text: `You now have a total of ${
                    totalWarns === 1
                      ? `${totalWarns} warn`
                      : `${totalWarns} warns`
                  }`,
                })
                .setColor(Colors.Red),
            ],
          });
        } catch (err) {}
        break;
      }
      case "remove": {
        const warnId = interaction.options.getString("warn-id", true);
        const warnsSchema = await WarnsSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!warnsSchema)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no warns found in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const warnToRemove = warnsSchema.raw.warns.find(
          (warn) => warn.id === warnId
        );
        if (!warnToRemove)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no warn that corresponds to the warn id provided!`
                )
                .setColor(Colors.Red),
            ],
          });
        warnsSchema.raw.warns.splice(
          warnsSchema.raw.warns.indexOf(warnToRemove),
          1
        );
        await warnsSchema.update(warnsSchema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | Warn \`${warnId}\` has been removed successfully!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "view": {
        const warnsSchema = await WarnsSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!warnsSchema)
          return await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no warns found in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const { warns } = warnsSchema.raw;
        const filterId = interaction.options.getString("filter-id");
        const filterUser = interaction.options.getUser("filter-user");
        if (!filterId && !filterUser)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | No filters have been applied! Please re-run the command and use atleast 1 filter!`
                )
                .setColor(Colors.Red),
            ],
          });
        let finalWarns = warns;
        if (filterId) finalWarns = finalWarns.filter((w) => w.id === filterId);
        if (filterUser)
          finalWarns = finalWarns.filter((w) => w.userId === filterUser.id);
        if (finalWarns.length === 0)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | No warns have been found with the filters specified!`
                )
                .setColor(Colors.Red),
            ],
          });
        let currentArrayIndex = 0;
        const message = await interaction.editReply(
          await messageData(
            interaction,
            finalWarns,
            currentArrayIndex,
            warnsSchema
          )
        );
        await displayWarns(message, finalWarns, currentArrayIndex, warnsSchema);
        break;
      }
    }
  }
}

const displayWarns = async (
  message: Message,
  warns: Warns[],
  index: number,
  schema: WarnsSchema
) => {
  const collector = message.createMessageComponentCollector({
    time: 600000,
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "first": {
        index = 0;
        await i.update(await messageData(i, warns, index, schema));
        collector.stop("collected");
        await displayWarns(message, warns, index, schema);
        break;
      }
      case "previous": {
        index === 0 ? (index = warns.length - 1) : index--;
        await i.update(await messageData(i, warns, index, schema));
        collector.stop("collected");
        await displayWarns(message, warns, index, schema);
        break;
      }
      case "next": {
        index === warns.length - 1 ? (index = 0) : index++;
        await i.update(await messageData(i, warns, index, schema));
        collector.stop("collected");
        await displayWarns(message, warns, index, schema);
        break;
      }
      case "last": {
        index = warns.length - 1;
        await i.update(await messageData(i, warns, index, schema));
        collector.stop("collected");
        await displayWarns(message, warns, index, schema);
        break;
      }
    }
  });

  collector.on("end", async (_c, reason) => {
    if (reason === "collected") return;
    if (!message.components[0]) return;
    const buttons =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        message.components[0].components.map((button) =>
          new ButtonBuilder((button as ButtonComponent).toJSON()).setDisabled(
            true
          )
        )
      );
    try {
      await message.edit({
        components: [buttons],
      });
    } catch (err) {}
  });
};

const messageData = async (
  interaction: BaseInteraction,
  warns: Warns[],
  index: number,
  schema: WarnsSchema
): Promise<InteractionEditReplyOptions> => {
  const warn = warns[index];
  const totalWarns = schema.raw.warns.filter(
    (w) => w.userId === warn.userId
  ).length;
  const embed = new EmbedBuilder()
    .setTitle(`Warn #${warn.id}`)
    .setThumbnail(
      (await interaction.client.users.fetch(warn.userId)).displayAvatarURL()
    )
    .setFields(
      {
        name: "Warned user:",
        value: userMention(warn.userId),
      },
      {
        name: "Warned by:",
        value: userMention(warn.warner),
      },
      {
        name: "Warn reason:",
        value: warn.reason,
      },
      {
        name: "Warned at:",
        value: time(Math.floor(warn.warnedAt / 1000), "F"),
      }
    )
    .setFooter({
      text: `This user has a total of ${
        totalWarns === 1 ? `${totalWarns} warn` : `${totalWarns} warns`
      }`,
    })
    .setColor(Colors.Blue);
  const buttons =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("first")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏪"),
      new ButtonBuilder()
        .setCustomId("previous")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⬅️"),
      new ButtonBuilder()
        .setLabel(`${index + 1}/${warns.length}`)
        .setCustomId("count")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("➡️"),
      new ButtonBuilder()
        .setCustomId("last")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏩")
    );
  if (warns.length === 1) return { embeds: [embed] };
  else return { embeds: [embed], components: [buttons] };
};
