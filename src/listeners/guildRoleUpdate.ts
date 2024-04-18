import { Listener } from "@sapphire/framework";
import {
  AuditLogEvent,
  Colors,
  EmbedBuilder,
  Events,
  PermissionFlagsBits,
  PermissionsBitField,
  Role,
  TextChannel,
  codeBlock,
  roleMention,
  time,
  userMention,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";
import { camelCaseToWords } from "../functions/camelCaseToWords";

export class GuildROleUpdateListener extends Listener<Events.GuildRoleUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.GuildRoleUpdate,
    });
  }
  public async run(oldRole: Role, newRole: Role) {
    if (newRole.managed) return;
    const logsSchema = await LogsSchema.find(newRole.client, newRole.guild.id);
    if (logsSchema && logsSchema.raw.logs[EventsEnum.GuildRoleUpdate].toggled) {
      const channelToSend = (await newRole.guild.channels.fetch(
        logsSchema.raw.logs[EventsEnum.GuildRoleUpdate].channel
      )) as TextChannel;
      const auditLogs = await newRole.guild.fetchAuditLogs();
      const emojiAuditLog = auditLogs.entries
        .filter((logs) => logs.action === AuditLogEvent.RoleUpdate)
        .first();
      const embed = new EmbedBuilder()
        .setTitle("Role updated")
        .addFields([
          {
            name: "Role:",
            value: roleMention(newRole.id),
            inline: true,
          },
          {
            name: "Updated by:",
            value: userMention(emojiAuditLog?.executorId!),
            inline: true,
          },
          {
            name: "Updated on:",
            value: time(
              Math.floor(emojiAuditLog?.createdTimestamp! / 1000),
              "F"
            ),
            inline: true,
          },
        ])
        .setColor(Colors.Blue);
      const nameChange = emojiAuditLog?.changes.find(
        (change) => change.key === "name"
      );
      const hoistChange = emojiAuditLog?.changes.find(
        (change) => change.key === "hoist"
      );
      const mentionableChange = emojiAuditLog?.changes.find(
        (change) => change.key === "mentionable"
      );
      const colorChange = emojiAuditLog?.changes.find(
        (change) => change.key === "color"
      );
      const permissionChange = emojiAuditLog?.changes.find(
        (change) => change.key === "permissions"
      );
      if (nameChange) {
        embed.addFields([
          {
            name: "Name:",
            value: codeBlock("diff", `-${nameChange.old}\n+${nameChange.new}`),
          },
        ]);
      }
      if (hoistChange) {
        embed.addFields([
          {
            name: "Hoist (displayed in a different category in online list):",
            value: codeBlock(
              "diff",
              `-${hoistChange.old ? "Hoisted" : "Not hoisted"}\n+${
                hoistChange.new ? "Hoisted" : "Not hoisted"
              }`
            ),
          },
        ]);
      }
      if (mentionableChange) {
        embed.addFields([
          {
            name: "Role can be mentioned by everyone?:",
            value: codeBlock(
              "diff",
              `-${
                mentionableChange.old ? "Mentionable" : "Not mentionable"
              }\n+${mentionableChange.new ? "Mentionable" : "Not mentionable"}`
            ),
          },
        ]);
      }
      if (colorChange) {
        embed.addFields([
          {
            name: "Color:",
            value: codeBlock(
              "diff",
              `-${oldRole.hexColor}\n+${newRole.hexColor}`
            ),
          },
        ]);
      }
      if (permissionChange) {
        const oldPermissions = new PermissionsBitField(
          BigInt(permissionChange.old as number)
        );
        const newPermissions = new PermissionsBitField(
          BigInt(permissionChange.new as number)
        );
        const permissions: string[] = [];
        if (
          oldPermissions.has(PermissionFlagsBits.Administrator) &&
          !newPermissions.has(PermissionFlagsBits.Administrator)
        ) {
          permissions.push("- Administrator");
        } else if (
          !oldPermissions.has(PermissionFlagsBits.Administrator) &&
          newPermissions.has(PermissionFlagsBits.Administrator)
        ) {
          permissions.push("+ Administrator");
        } else {
          for (const [name, permission] of Object.entries(
            PermissionFlagsBits
          )) {
            if (
              oldPermissions.has(permission) === newPermissions.has(permission)
            )
              continue;

            if (oldPermissions.has(permission)) {
              permissions.push(
                permission === PermissionsBitField.Flags.ModerateMembers
                  ? "- Timeout members"
                  : `-${camelCaseToWords(name)}`
              );
            } else {
              permissions.push(
                permission === PermissionsBitField.Flags.ModerateMembers
                  ? "+ Timeout Members"
                  : `+${camelCaseToWords(name)}`
              );
            }
          }
        }
        embed.addFields([
          {
            name: "Permission updates:",
            value: codeBlock("diff", permissions.join("\n")),
          },
        ]);
      }
      if (embed.data.fields?.length! <= 3) return;
      await channelToSend.send({
        embeds: [embed],
      });
    }
  }
}
