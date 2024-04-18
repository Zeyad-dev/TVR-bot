import { Listener } from "@sapphire/framework";
import {
  EmbedBuilder,
  Events,
  codeBlock,
  userMention,
  TextChannel,
  Colors,
  User,
} from "discord.js";
import { EventsEnum, LogsSchema } from "../schemas/Logs";

export class UserUpdateListener extends Listener<Events.UserUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.UserUpdate,
    });
  }
  public async run(oldUser: User, newUser: User) {
    (await newUser.client.guilds.fetch())
      .filter(async (g) =>
        (await (await newUser.client.guilds.fetch(g.id)).members.fetch()).has(
          newUser.id
        )
      )
      .map(async (oAuth2Guild) => {
        const guild = await oAuth2Guild.client.guilds.fetch(oAuth2Guild.id);
        if (!(await guild.members.fetch()).has(guild.client.id as string))
          return;
        const logsSchema = await LogsSchema.find(guild.client, guild.id);
        if (logsSchema && logsSchema.raw.logs[EventsEnum.UserUpdate].toggled) {
          const channel = (await guild.channels.fetch(
            logsSchema.raw.logs[EventsEnum.UserUpdate].channel
          )) as TextChannel;

          const embed = new EmbedBuilder()
            .setTitle("User updated")
            .addFields([
              { name: "User:", value: userMention(newUser.id), inline: true },
              {
                name: "User ID:",
                value: codeBlock(newUser.id),
                inline: true,
              },
            ])
            .setThumbnail(newUser.displayAvatarURL())
            .setColor(Colors.Blue);
          const nameChange = oldUser.username !== newUser.username;
          if (nameChange) {
            embed.addFields([
              {
                name: "Username:",
                value: codeBlock(
                  "diff",
                  `-${oldUser.username}\n+${newUser.username}`
                ),
              },
            ]);
          }
          const displayNameChange = oldUser.displayName !== newUser.displayName;
          if (displayNameChange) {
            embed.addFields([
              {
                name: "Display name:",
                value: codeBlock(
                  "diff",
                  `-${oldUser.displayName}\n+${newUser.displayName}`
                ),
              },
            ]);
          }
          const avatarChange =
            oldUser.displayAvatarURL() !== newUser.displayAvatarURL();
          if (avatarChange) {
            embed.addFields([
              {
                name: "Avatar:",
                value: `${
                  oldUser.displayAvatarURL()
                    ? `[Old avatar](${oldUser.displayAvatarURL()})`
                    : `\`Old avatar:\` No avatar!`
                }\n${
                  newUser.displayAvatarURL()
                    ? `[New avatar](${newUser.displayAvatarURL()})`
                    : `\`New avatar:\` No avatar!`
                }`,
              },
            ]);
          }
          if (embed.data.fields?.length! <= 2) return;
          await channel.send({
            embeds: [embed],
          });
        }
      });
  }
}
