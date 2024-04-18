import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

interface embedData {
  title?: string;
  description: string;
  color: string;
}

export interface TimedMessage {
  isEmbed: boolean;
  embeds?: embedData;
  content?: string;
  channel: Snowflake;
  interval: number;
  lastSendTime: number;
  message: Snowflake;
}

export interface RawTimedMessagesSchema {
  guildId: Snowflake;
  timedMessages: TimedMessage[];
}

const timedMessages =
  database.collection<RawTimedMessagesSchema>("timedMessages");

export class TimedMessagesSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawTimedMessagesSchema>
  ) {}

  public async update(data: Partial<RawTimedMessagesSchema>): Promise<this> {
    await timedMessages.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<TimedMessagesSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await timedMessages.findOne({ guildId });

    if (!raw) return null;

    const schema = new TimedMessagesSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawTimedMessagesSchema
  ): Promise<TimedMessagesSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await timedMessages.insertOne(data);

    const raw = await timedMessages.findOne({ _id: insertedId });

    const schema = new TimedMessagesSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawTimedMessagesSchema
  ): Promise<TimedMessagesSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<
    Snowflake,
    TimedMessagesSchema
  >();
}
