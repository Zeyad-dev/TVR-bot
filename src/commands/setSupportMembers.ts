import { Command } from "@sapphire/framework";
import {
  ButtonInteraction,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
  Snowflake,
  formatEmoji,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";
import { supportMembersHandler } from "../functions/supportMembersHandler";
export class SetSupportMembersCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((command) =>
      command
        .setName("set-ticket-support-members")
        .setDescription(
          "Sets Users/Roles as support representatives for tickets"
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
    const ticketsSchema = await TicketsSchema.find(
      interaction.client,
      interaction.guild!.id
    );
    if (!ticketsSchema)
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221828309743046677",
                true
              )} | Please initiate the ticket system first using </tickets-setup:1225427374863028276>!`
            )
            .setColor(Colors.Red),
        ],
      });
    const handleSubmit = (
      i: ButtonInteraction,
      schema: TicketsSchema | null,
      roles: Snowflake[],
      users: Snowflake[]
    ) => {
      i.update({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${formatEmoji(
                "1221897469592600677",
                true
              )} | Support representatives roles/users have been updated successfully!`
            )
            .setColor(Colors.Green),
        ],
        components: [],
      });
      schema!.update({
        roleSupportMembers: roles,
        userSupportMembers: users,
      });
    };
    return await supportMembersHandler(
      interaction,
      ticketsSchema,
      handleSubmit
    );
  }
}
