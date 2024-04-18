import { Command } from "@sapphire/framework";
import { StaffMembersSchema } from "../schemas/StaffMembers";
import {
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  GuildMember,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  formatEmoji,
  time,
  userMention,
} from "discord.js";
import { NotesSchema } from "../schemas/Notes";

export class NotesCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("notes")
        .setDescription("Manage notes in this server (Add/Remove/View)")
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Adds a note to the specified user")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to add the note to")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Removes the note set to the specified user")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to remove the note from")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("view")
            .setDescription("View notes of a user in this server")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to view notes of")
                .setRequired(true)
            )
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const staffMembersSchema = await StaffMembersSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (!staffMembersSchema || staffMembersSchema.raw.forNotes.length === 0)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | No staff members have been assigned to have the privilege to assign notes!`
            )
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
    if (
      !(interaction.member as GuildMember).roles.cache.hasAny(
        ...staffMembersSchema.raw.forNotes
      ) &&
      interaction.guild!.ownerId != interaction.user.id
    )
      return interaction.reply({
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
        ephemeral: true,
      });
    switch (interaction.options.getSubcommand()) {
      case "add": {
        const user = interaction.options.getUser("user", true);
        if (interaction.user.id === user.id)
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | You can not add notes on yourself!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        let memberToAddNotes: GuildMember;
        try {
          memberToAddNotes = await interaction.guild!.members.fetch(user);
        } catch (err) {
          return interaction.reply({
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
            ephemeral: true,
          });
        }
        const member = await interaction.guild!.members.fetch(interaction.user);
        if (
          member.roles.highest.comparePositionTo(
            memberToAddNotes.roles.highest
          ) < 0 &&
          interaction.guild!.ownerId != interaction.user.id
        )
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | You do not have the permissions to add notes to this user!`
                )
                .setColor(Colors.Red),
            ],
            ephemeral: true,
          });
        const notesSchema = await NotesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        const textInput = new TextInputBuilder()
          .setCustomId("text")
          .setMaxLength(1024)
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Place your note here")
          .setLabel("Set a note for this user:");
        if (
          notesSchema &&
          notesSchema.raw.notes.find((note) => note.userId === user.id)
        )
          textInput.setValue(
            notesSchema.raw.notes.find((note) => note.userId === user.id)!.text
          );
        await interaction.showModal(
          new ModalBuilder()
            .setTitle("Note")
            .setCustomId("noteModal")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                textInput
              )
            )
        );
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 600000,
        });
        await modalInteraction.deferReply({
          ephemeral: true,
        });
        const text = modalInteraction.fields.getTextInputValue("text");
        const data = {
          userId: user.id,
          author: interaction.user.id,
          text,
          noteAddedOn: Date.now(),
          editors: [],
        };
        if (notesSchema) {
          if (notesSchema.raw.notes.find((note) => note.userId === user.id)) {
            const note = notesSchema.raw.notes.find(
              (note) => note.userId === user.id
            )!;
            note.text = text;
            if (!note.editors.includes(interaction.user.id))
              note.editors.push(interaction.user.id);
          } else notesSchema.raw.notes.push(data);
          await notesSchema.update(notesSchema.raw);
        } else {
          await NotesSchema.create(interaction.client, {
            guildId: interaction.guild!.id,
            notes: [data],
          });
        }
        await modalInteraction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji(
                  "1221897469592600677",
                  true
                )} | A note has been added for ${userMention(
                  user.id
                )} successfully!`
              )
              .setFields({
                name: "Note:",
                value: text,
                inline: true,
              })
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "remove": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const user = interaction.options.getUser("user", true);
        const notesSchema = await NotesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!notesSchema)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no notes found in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const warnToRemove = notesSchema.raw.notes.find(
          (warn) => warn.userId === user.id
        );
        if (!warnToRemove)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There is no note set on the specified user!`
                )
                .setColor(Colors.Red),
            ],
          });
        notesSchema.raw.notes.splice(
          notesSchema.raw.notes.indexOf(warnToRemove),
          1
        );
        await notesSchema.update(notesSchema.raw);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${formatEmoji("1221897469592600677", true)} | ${userMention(
                  user.id
                )}'s note has been successfully removed!`
              )
              .setColor(Colors.Green),
          ],
        });
        break;
      }
      case "view": {
        await interaction.deferReply({
          ephemeral: true,
        });
        const notesSchema = await NotesSchema.find(
          interaction.client,
          interaction.guild!.id
        );
        if (!notesSchema)
          return await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | There are no notes found in this server!`
                )
                .setColor(Colors.Red),
            ],
          });
        const user = interaction.options.getUser("user", true);
        const note = notesSchema.raw.notes.find(
          (note) => note.userId === user.id
        );
        if (!note)
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `${formatEmoji(
                    "1221828309743046677",
                    true
                  )} | This user does not have any notes set to!`
                )
                .setColor(Colors.Red),
            ],
          });
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `${
                  (
                    await interaction.client.users.fetch(note.userId)
                  ).username
                }'s note`
              )
              .setThumbnail(
                (
                  await interaction.client.users.fetch(note.userId)
                ).displayAvatarURL()
              )
              .setFields(
                {
                  name: "Note:",
                  value: note.text,
                },
                {
                  name: "Note originally added by:",
                  value: userMention(note.author),
                },
                {
                  name: "Editors:",
                  value:
                    note.editors.length === 0
                      ? "Note hasn't been edited by anyone"
                      : note.editors
                          .map((editor) => `* ${userMention(editor)}`)
                          .join("\n"),
                },
                {
                  name: "Note added on:",
                  value: time(Math.floor(note.noteAddedOn / 1000), "F"),
                }
              )
              .setColor(Colors.Blue),
          ],
        });
        break;
      }
    }
  }
}
