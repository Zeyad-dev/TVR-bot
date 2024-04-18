import { Command } from "@sapphire/framework";
import {
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  formatEmoji,
  type TextChannel,
  type User,
  Colors,
  PartialMessage,
  Collection,
  Message,
  userMention,
} from "discord.js";
import { purges } from "..";

export class PurgeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("purge")
        .setDescription("Purge command")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("all")
            .setDescription(
              "Purges all messages in the channel without filters"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("human")
            .setDescription(
              "Purges all messages in the channel that are from users (non-bot messages)"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("bot")
            .setDescription(
              "Purges all messages in the channel that are from bot (non-user messages)"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("contains")
            .setDescription(
              "Purges all messages in the channel that contains the specified substring"
            )
            .addStringOption((string) =>
              string
                .setName("substring")
                .setDescription(
                  "Delete all messages that contains the specified substring (text)"
                )
                .setRequired(true)
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("embeds")
            .setDescription(
              "Purges all messages in the channel that contain embeds"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("emojis")
            .setDescription(
              "Purges all messages in the channel that contain emojis"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("files")
            .setDescription(
              "Purges all messages in the channel that contain file attachments."
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("images")
            .setDescription(
              "Purges all messages in the channel that contain image attachments."
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("links")
            .setDescription(
              "Purges all messages in the channel that contain links."
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("mentions")
            .setDescription(
              "Purges all messages in the channel that contain mentions."
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
            .addBooleanOption((boolean) =>
              boolean
                .setName("users")
                .setDescription(
                  "Whether to purge messages containing user mentions or no (If not specified, default is true)"
                )
            )
            .addBooleanOption((boolean) =>
              boolean
                .setName("roles")
                .setDescription(
                  "Whether to purge messages containing role mentions or no (If not specified, default is true)"
                )
            )
            .addBooleanOption((boolean) =>
              boolean
                .setName("channels")
                .setDescription(
                  "Whether to purge messages containing channel mentions or no (If not specified, default is true)"
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reactions")
            .setDescription(
              "Removes all reactions from messages that have them in this channel"
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "The amount of messages to remove reactions from. Leave this option to delete all related messages."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("user")
            .setDescription(
              "Purges all messages in the channel sent from a certain user."
            )
            .addUserOption((user) =>
              user
                .setName("user")
                .setDescription("The user to purge all messages from")
                .setRequired(true)
            )
            .addIntegerOption((integer) =>
              integer
                .setName("amount")
                .setDescription(
                  "Amount of messages to purge. Leave unspecified to delete all related messages (upto 100 messages)."
                )
                .setMaxValue(100)
                .setMinValue(1)
            )
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    if (!interaction.inCachedGuild()) return;

    const option = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger("amount") ?? 100;

    await interaction.deferReply({
      ephemeral: true,
    });
    if (
      !(await interaction.guild!.members.fetchMe()).permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    )
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | I am missing the \`Manage Messages\` permission!`
            )
            .setColor(Colors.Red),
        ],
      });
    switch (option) {
      case "all": {
        await purgeAll(amount, interaction);
        break;
      }
      case "human": {
        await purgeHumans(amount, interaction);
        break;
      }
      case "bot": {
        await purgeBots(amount, interaction);
        break;
      }
      case "contains": {
        const substring = interaction.options.getString("substring", true);
        await purgeContains(amount, substring, interaction);
        break;
      }
      case "embeds": {
        await purgeEmbed(amount, interaction);
        break;
      }
      case "emojis": {
        await purgeEmojis(amount, interaction);
        break;
      }
      case "files": {
        await purgeFiles(amount, interaction);
        break;
      }
      case "images": {
        await purgeImages(amount, interaction);
        break;
      }
      case "links": {
        await purgeLinks(amount, interaction);
        break;
      }
      case "mentions": {
        const user = interaction.options.getBoolean("users") ?? true;
        const role = interaction.options.getBoolean("roles") ?? true;
        const channel = interaction.options.getBoolean("channels") ?? true;
        await purgeMentions(amount, user, role, channel, interaction);
        break;
      }
      case "reactions": {
        await purgeReactions(amount, interaction);
        break;
      }
      case "user": {
        const user = interaction.options.getUser("user") as User;
        await purgeUser(amount, user, interaction);
        break;
      }
    }
  }
}
const purgeAll = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const channel = interaction.channel as TextChannel;
  let deleted;
  const messages = await channel.messages.fetch({ limit });
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const purgeHumans = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) => !m.author.bot);
  const channel = interaction.channel as TextChannel;
  let deleted;
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const purgeBots = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) => m.author.bot);
  const channel = interaction.channel as TextChannel;
  let deleted;
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const purgeContains = async (
  limit: number,
  string: string,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) => m.content.toLowerCase().includes(string.toLowerCase()));
  const channel = interaction.channel as TextChannel;
  let deleted;
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const purgeEmbed = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) => m.embeds.length);
  const channel = interaction.channel as TextChannel;
  let deleted;
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const imageTypes = [
  "image/png",
  "image/gif",
  "image/jpg",
  "image/jpeg",
  "image/webp",
];
const purgeFiles = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) =>
    m.attachments.some((a) => !imageTypes.includes(a.contentType as string))
  );
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = interaction.channel as TextChannel;
  let deleted;
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};
const purgeImages = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  )?.filter((m) =>
    m.attachments.some((a) => imageTypes.includes(a.contentType as string))
  );
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = interaction.channel as TextChannel;
  let deleted: Collection<string, PartialMessage | Message | undefined>;
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const purgeEmojis = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  ).filter((m) => {
    return emojiParser(m.content).map((a) => {
      if (a.name) return true;
      return;
    }).length;
  });
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = interaction.channel as TextChannel;
  let deleted;
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const purgeLinks = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const exp = /http[s]?:\/\/[A-z0-9[.| ?]*]*\/?/gm;
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  ).filter((m) => exp.test(m.content));
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = interaction.channel as TextChannel;
  let deleted;
  try {
    deleted = await channel.bulkDelete(messages);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const purgeMentions = async (
  limit: number,
  users: boolean,
  roles: boolean,
  channels: boolean,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  ).filter((m) => {
    if (users && m.mentions.users.size) return true;
    if (roles && m.mentions.roles.size) return true;
    if (channels && m.mentions.channels.size) return true;
  });
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  const channel = interaction.channel as TextChannel;
  let deleted;
  try {
    deleted = await channel.bulkDelete(messages);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${deleted.size}** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const purgeReactions = async (
  limit: number,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  ).filter((m) => m.reactions.cache.size);
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no reactions in the range of **${limit}** messages in this channel to be removed!`
          )
          .setColor(Colors.Red),
      ],
    });
  try {
    messages.forEach(async (m) => {
      await m.reactions.removeAll();
    });
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to remove the reactions! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully removed reactions from **${
            messages.size
          }** messages!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const purgeUser = async (
  limit: number,
  user: User,
  interaction: Command.ChatInputCommandInteraction
) => {
  const messages = (
    await interaction.channel!.messages.fetch({ limit })
  ).filter((m) => m.author.id == user.id);
  const channel = interaction.channel as TextChannel;
  if (!messages.size)
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | There are no messages in this channel to be deleted!`
          )
          .setColor(Colors.Red),
      ],
    });
  let deleted;
  try {
    deleted = await channel.bulkDelete(messages, true);
  } catch (err) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${formatEmoji(
              "1221828309743046677",
              true
            )} | An error occurred while trying to delete the messages! Please re-run the command again.`
          )
          .setColor(Colors.Red),
      ],
    });
    return;
  }
  if (
    Object.values(purges).find((str) =>
      str.find((v) => v.channel === channel.id)
    )
  ) {
    const index = Object.values(purges).findIndex((str) =>
      str.find((v) => v.channel === channel.id)
    );
    purges[Object.keys(purges)[index]].splice(index, 1);
  }
  purges[interaction.user.id]
    ? purges[interaction.user.id].push({
        channel: channel.id,
        messages: deleted.map((message) => message!.id),
      })
    : (purges[interaction.user.id] = [
        {
          channel: channel.id,
          messages: deleted.map((message) => message!.id),
        },
      ]);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          `${formatEmoji(
            "1221897469592600677",
            true
          )} | Successfully deleted **${
            messages.size
          }** messages from ${userMention(user.id)}!`
        )
        .setColor(Colors.Green),
    ],
  });
};

const emojiParser = (pr: string) => {
  const emojis: {
    animated: boolean;
    name: string;
    id: string;
    url: string;
  }[] = [];
  pr.replace(
    /<(?<animated>a)?:(?<name>\w{2,32}):(?<id>\d{17,20})>/g,
    (
      sub,
      _1,
      _2,
      _3,
      _4,
      _5,
      group: {
        animated: "a" | undefined;
        name: string;
        id: string;
      }
    ) =>
      void emojis.push({
        ...group,
        animated: Boolean(group.animated ?? false),
        url: `https://cdn.discordapp.com/emojis/${group.id}.${
          group.animated ?? false ? "gif" : "png"
        }`,
      }) ?? sub
  );
  return emojis;
};
