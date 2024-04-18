import { Listener } from "@sapphire/framework";
import { ColorResolvable, EmbedBuilder, Events, Message } from "discord.js";
import { StickyMessagesSchema } from "../schemas/StickyMessages";
import { AutoResponsesSchema } from "../schemas/AutoResponses";

export class MessageCreateListener extends Listener<Events.MessageCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.MessageCreate,
    });
  }
  public async run(message: Message<true>) {
    if (!message.guild) return;
    const stickyMessagesSchema = await StickyMessagesSchema.find(
      message.client,
      message.guild!.id
    );
    const autoResponsesSchema = await AutoResponsesSchema.find(
      message.client,
      message.guild!.id
    );
    if (stickyMessagesSchema) {
      if (message.flags.has("Ephemeral")) return;
      const stickyMessage = stickyMessagesSchema.raw.stickyMessages.find(
        (data) => data.channel === message.channel.id
      );
      if (stickyMessage) {
        if (message.author.id !== message.client.id) {
          message.channel.messages.delete(stickyMessage.message).then(() => {
            message.channel
              .send(
                stickyMessage.isEmbed
                  ? {
                      embeds: [
                        new EmbedBuilder()
                          .setTitle(stickyMessage.embedData!.title ?? null)
                          .setDescription(stickyMessage.embedData!.description)
                          .setColor(
                            stickyMessage.embedData!.color as ColorResolvable
                          ),
                      ],
                    }
                  : { content: stickyMessage.content! }
              )
              .then((msg) => {
                stickyMessage.message = msg.id;
                stickyMessagesSchema.update(stickyMessagesSchema.raw);
              });
          });
        }
      }
    }
    if (autoResponsesSchema) {
      if (message.author.bot) return;
      autoResponsesSchema.raw.autoResponses.forEach(async (autoResponse) => {
        if (message.content.includes(autoResponse.trigger)) {
          if (autoResponse.isEmbed) {
            const embed = new EmbedBuilder()
              .setColor(autoResponse.embeds!.color as ColorResolvable)
              .setDescription(autoResponse.embeds!.description);
            if (autoResponse.embeds!.title)
              embed.setTitle(autoResponse.embeds!.title);
            await message.channel.send({
              embeds: [embed],
            });
          } else {
            await message.channel.send({
              content: autoResponse.content!,
            });
          }
        }
      });
    }
  }
}
