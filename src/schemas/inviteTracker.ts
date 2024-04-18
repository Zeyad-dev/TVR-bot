import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export interface InviteData {
  inviter: Snowflake;
  code: string;
  uses: number;
  invitesCount: number;
  users: Snowflake[];
}

export interface RawInviteTrackerSchema {
  guildId: Snowflake;
  savedInvites: InviteData[];
}

const inviteTracker =
  database.collection<RawInviteTrackerSchema>("inviteTracker");

export class InviteTrackerSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawInviteTrackerSchema>
  ) {}

  public async update(data: Partial<RawInviteTrackerSchema>): Promise<this> {
    await inviteTracker.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<InviteTrackerSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await inviteTracker.findOne({ guildId });

    if (!raw) return null;

    const schema = new InviteTrackerSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawInviteTrackerSchema
  ): Promise<InviteTrackerSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await inviteTracker.insertOne(data);

    const raw = await inviteTracker.findOne({ _id: insertedId });

    const schema = new InviteTrackerSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawInviteTrackerSchema
  ): Promise<InviteTrackerSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<
    Snowflake,
    InviteTrackerSchema
  >();
}
