import { Listener } from "@sapphire/framework";
import { Events, Invite } from "discord.js";
import { InviteData, InviteTrackerSchema } from "../schemas/inviteTracker";

export class InviteCreateListener extends Listener<Events.InviteCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, {
      ...options,
      once: false,
      event: Events.InviteCreate,
    });
  }
  public async run(invite: Invite) {
    const schema = await InviteTrackerSchema.find(
      invite.client,
      invite.guild!.id
    );
    const data: InviteData = {
      inviter: invite.inviter!.id,
      users: [],
      uses: invite.uses || 0,
      code: invite.code,
      invitesCount: 0,
    };
    if (schema) {
      schema.raw.savedInvites.push(data);
      schema.update(schema.raw);
    } else
      await InviteTrackerSchema.create(invite.client, {
        guildId: invite.guild!.id,
        savedInvites: [data],
      });
  }
}
