import { Listener } from "@sapphire/framework";
import { Events, Invite } from "discord.js";
import { InviteTrackerSchema } from "../schemas/inviteTracker";

export class InviteDeleteListener extends Listener<Events.InviteDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.InviteDelete,
    });
  }
  public async run(invite: Invite) {
    const schema = await InviteTrackerSchema.find(
      invite.client,
      invite.guild!.id
    );
    if (!schema) return;
    const index = schema.raw.savedInvites.findIndex(
      (data) => data.code === invite.code
    );
    if (!index) return;
    schema.raw.savedInvites.splice(index, 1);
    await schema.update(schema.raw);
  }
}
