import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

interface embedData {
  title?: string;
  description: string;
  color: string;
}

export interface StickyMessages {
  channel: Snowflake;
  message: string;
  isEmbed: boolean;
  embedData?: embedData;
  content?: string;
}

export interface RawStickyMessagesSchema {
  guildId: Snowflake;
  stickyMessages: StickyMessages[];
}

const stickyMessagesSystem =
  database.collection<RawStickyMessagesSchema>("stickyMessages");

export class StickyMessagesSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawStickyMessagesSchema>
  ) {}

  public async update(data: Partial<RawStickyMessagesSchema>): Promise<this> {
    await stickyMessagesSystem.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<StickyMessagesSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await stickyMessagesSystem.findOne({ guildId });

    if (!raw) return null;

    const schema = new StickyMessagesSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawStickyMessagesSchema
  ): Promise<StickyMessagesSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await stickyMessagesSystem.insertOne(data);

    const raw = await stickyMessagesSystem.findOne({ _id: insertedId });

    const schema = new StickyMessagesSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawStickyMessagesSchema
  ): Promise<StickyMessagesSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<
    Snowflake,
    StickyMessagesSchema
  >();
}
