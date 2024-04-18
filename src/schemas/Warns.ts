import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export interface Warns {
  userId: Snowflake;
  warner: Snowflake;
  reason: string;
  warnedAt: number;
  id: string;
}

export interface RawWarnsSchema {
  guildId: Snowflake;
  warns: Warns[];
}

const warns = database.collection<RawWarnsSchema>("warns");

export class WarnsSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawWarnsSchema>
  ) {}

  public async update(data: Partial<RawWarnsSchema>): Promise<this> {
    await warns.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<WarnsSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await warns.findOne({ guildId });

    if (!raw) return null;

    const schema = new WarnsSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawWarnsSchema
  ): Promise<WarnsSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await warns.insertOne(data);

    const raw = await warns.findOne({ _id: insertedId });

    const schema = new WarnsSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawWarnsSchema
  ): Promise<WarnsSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<Snowflake, WarnsSchema>();
}
