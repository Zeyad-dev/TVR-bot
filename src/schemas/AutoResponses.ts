import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

interface embedData {
  title?: string;
  description: string;
  color: string;
}

export interface AutoResponses {
  isEmbed: boolean;
  embeds?: embedData;
  content?: string;
  trigger: string;
}

export interface RawAutoResponsesSchema {
  guildId: Snowflake;
  autoResponses: AutoResponses[];
}

const autoResponses =
  database.collection<RawAutoResponsesSchema>("autoResponses");

export class AutoResponsesSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawAutoResponsesSchema>
  ) {}

  public async update(data: Partial<RawAutoResponsesSchema>): Promise<this> {
    await autoResponses.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<AutoResponsesSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await autoResponses.findOne({ guildId });

    if (!raw) return null;

    const schema = new AutoResponsesSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawAutoResponsesSchema
  ): Promise<AutoResponsesSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await autoResponses.insertOne(data);

    const raw = await autoResponses.findOne({ _id: insertedId });

    const schema = new AutoResponsesSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawAutoResponsesSchema
  ): Promise<AutoResponsesSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<
    Snowflake,
    AutoResponsesSchema
  >();
}
