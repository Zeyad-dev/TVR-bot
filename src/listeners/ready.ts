import { Listener } from "@sapphire/framework";
import { Client, Events } from "discord.js";
import { updateCounters } from "../intervals/updateCounters";
import { sendTimedMessage } from "../intervals/sendTimedMessage";

export class ReadyListener extends Listener<Events.ClientReady> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: true,
      event: Events.ClientReady,
    });
  }
  public run(client: Client<true>) {
    const { username, id } = client.user!;
    this.container.logger.info(`Successfully logged in as ${username} (${id})`);
    setInterval(() => {
      updateCounters(client);
    }, 600000);
    setInterval(() => {
      sendTimedMessage(client);
    }, 60000);
  }
}