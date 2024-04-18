import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export interface RawCountersSchema {
  guildId: Snowflake;
  userCountChannel: Snowflake;
  botCountChannel: Snowflake;
  roleCountChannel: Snowflake;
  channelCountChannel: Snowflake;
  totalMembersCountChannel: Snowflake;
  lastUpdateTime: number;
}

const counters = database.collection<RawCountersSchema>("counters");

export class CountersSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawCountersSchema>
  ) {}

  public async update(data: Partial<RawCountersSchema>): Promise<this> {
    await counters.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<CountersSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await counters.findOne({ guildId });

    if (!raw) return null;

    const schema = new CountersSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawCountersSchema
  ): Promise<CountersSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await counters.insertOne(data);

    const raw = await counters.findOne({ _id: insertedId });

    const schema = new CountersSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawCountersSchema
  ): Promise<CountersSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<Snowflake, CountersSchema>();
}
