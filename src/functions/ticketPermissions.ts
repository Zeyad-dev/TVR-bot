import {
  BaseInteraction,
  OverwriteResolvable,
  PermissionsBitField,
  Snowflake,
} from "discord.js";
import { TicketsSchema } from "../schemas/TicketsSchema";

export const ticketPermissions = async (
  interaction: BaseInteraction,
  schema: TicketsSchema,
  status: string,
  adminOnly: boolean
) => {
  const permissionOverwrites: OverwriteResolvable[] = [];
  if (!adminOnly) {
    schema.raw.roleSupportMembers?.map((roleId) => {
      permissionOverwrites.push({
        id: roleId,
        allow: PermissionsBitField.Flags.ViewChannel,
      });
    });
    schema.raw.userSupportMembers?.map((userId) => {
      permissionOverwrites.push({
        id: userId,
        allow: PermissionsBitField.Flags.ViewChannel,
      });
    });
  }
  permissionOverwrites.push({
    id: interaction.guild?.roles.everyone.id as Snowflake,
    deny: PermissionsBitField.Flags.ViewChannel,
  });
  status == "opened"
    ? permissionOverwrites.push({
        id: interaction.user.id,
        allow: PermissionsBitField.Flags.ViewChannel,
      })
    : permissionOverwrites.push({
        id: interaction.user.id,
        deny: PermissionsBitField.Flags.ViewChannel,
      });
  return permissionOverwrites;
};
