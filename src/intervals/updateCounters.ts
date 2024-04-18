import { ChannelType, Client } from "discord.js";
import { CountersSchema } from "../schemas/Counters";
export function updateCounters(client: Client<true>) {
  client.guilds.cache.forEach(async (guild) => {
    const schema = await CountersSchema.find(client, guild.id);
    if (!schema) return;
    if (schema.raw.lastUpdateTime + 600000 > Date.now()) return;
    (await guild.channels.fetch(schema.raw.totalMembersCountChannel))?.edit({
      name: `Member count: ${guild.memberCount}`,
    });
    (await guild.channels.fetch(schema.raw.userCountChannel))?.edit({
      name: `User count: ${
        (
          await guild.members.fetch({
            time: 600000,
          })
        ).filter((member) => !member.user.bot).size
      }`,
    });
    (await guild.channels.fetch(schema.raw.channelCountChannel))?.edit({
      name: `Channel count: ${
        (await guild.channels.fetch()).filter(
          (channel) => channel?.type != ChannelType.GuildCategory
        ).size
      }`,
    });
    (await guild.channels.fetch(schema.raw.roleCountChannel))?.edit({
      name: `Roles count: ${
        (await guild.roles.fetch()).filter(
          (role) => role.id != guild.roles.everyone.id
        ).size
      }`,
    });
    (await guild.channels.fetch(schema.raw.botCountChannel))?.edit({
      name: `Bot count: ${
        (
          await guild.members.fetch({
            time: 600000,
          })
        ).filter((member) => member.user.bot).size
      }`,
    });
    schema.raw.lastUpdateTime = Date.now();
    await schema.update(schema.raw);
  });
}
