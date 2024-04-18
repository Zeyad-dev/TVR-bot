import {
  Client,
  ColorResolvable,
  EmbedBuilder,
  Message,
  TextChannel,
} from "discord.js";
import { TimedMessagesSchema } from "../schemas/TimedMessages";

export function sendTimedMessage(client: Client<true>) {
  client.guilds.cache.forEach(async (guild) => {
    const schema = await TimedMessagesSchema.find(client, guild.id);
    if (!schema) return;
    schema.raw.timedMessages.forEach(async (timedMessage) => {
      if (timedMessage.lastSendTime + timedMessage.interval > Date.now())
        return;
      const channel = (await guild.channels.fetch(
        timedMessage.channel
      )) as TextChannel;
      let message: Message;
      try {
        const messageToDelete = await channel.messages.fetch(
          timedMessage.message
        );
        await messageToDelete.delete();
      } catch (err) {}
      if (timedMessage.isEmbed) {
        const embed = new EmbedBuilder()
          .setColor(timedMessage.embeds!.color as ColorResolvable)
          .setDescription(timedMessage.embeds!.description);
        if (timedMessage.embeds!.title)
          embed.setTitle(timedMessage.embeds!.title);
        message = await channel.send({
          embeds: [embed],
        });
      } else {
        message = await channel.send({
          content: timedMessage.content!,
        });
      }
      timedMessage.lastSendTime = Date.now();
      timedMessage.message = message.id;
      await schema.update(schema.raw);
    });
  });
}
