import { Command } from "@sapphire/framework";
import { CountersSchema } from "../schemas/Counters";
import {
  ChannelType,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
  formatEmoji,
} from "discord.js";

export class SetupCountersCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("setup-counters")
        .setDescription(
          "Creates private voice channels that keep track of various counts in the server."
        )
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
    const schema = await CountersSchema.find(
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
              )} | A counter system in this server has already been setup!`
            )
            .setColor(Colors.Red),
        ],
      });
    const category = await interaction.guild!.channels.create({
      name: "📊 Server Stats 📊",
      type: ChannelType.GuildCategory,
      position: 0,
      permissionOverwrites: [
        {
          id: interaction.guild!.roles.everyone.id,
          deny: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
      ],
    });
    const totalMembersCountChannel = (
      await interaction.guild!.channels.create({
        name: `Member count: ${interaction.guild!.memberCount}`,
        type: ChannelType.GuildVoice,
        position: 0,
        parent: category,
      })
    ).id;
    const userCountChannel = (
      await interaction.guild!.channels.create({
        name: `User count: ${
          interaction.guild!.members.cache.filter((member) => !member.user.bot)
            .size
        }`,
        type: ChannelType.GuildVoice,
        position: 1,
        parent: category,
      })
    ).id;
    const channelCountChannel = (
      await interaction.guild!.channels.create({
        name: `Channel count: ${
          interaction.guild!.channels.cache.filter(
            (channel) => channel.type != ChannelType.GuildCategory
          ).size
        }`,
        type: ChannelType.GuildVoice,
        position: 2,
        parent: category,
      })
    ).id;
    const roleCountChannel = (
      await interaction.guild!.channels.create({
        name: `Role count: ${interaction.guild!.roles.cache.size}`,
        type: ChannelType.GuildVoice,
        position: 3,
        parent: category,
      })
    ).id;
    const botCountChannel = (
      await interaction.guild!.channels.create({
        name: `Bot count: ${
          interaction.guild!.members.cache.filter((member) => member.user.bot)
            .size
        }`,
        type: ChannelType.GuildVoice,
        position: 4,
        parent: category,
      })
    ).id;
    await CountersSchema.create(interaction.client, {
      guildId: interaction.guild!.id,
      totalMembersCountChannel,
      userCountChannel,
      channelCountChannel,
      roleCountChannel,
      botCountChannel,
      lastUpdateTime: Date.now(),
    });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221897469592600677",
              true
            )} | Counter channels have been successfully created! They will be updated every 10 minutes!`
          )
          .setColor(Colors.Green),
      ],
    });
  }
}
