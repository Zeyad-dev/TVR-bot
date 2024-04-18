import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export interface Notes {
  userId: Snowflake;
  author: Snowflake;
  text: string;
  noteAddedOn: number;
  editors: Snowflake[]
}

export interface RawNotesSchema {
  guildId: Snowflake;
  notes: Notes[];
}

const notes = database.collection<RawNotesSchema>("notes");

export class NotesSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawNotesSchema>
  ) {}

  public async update(data: Partial<RawNotesSchema>): Promise<this> {
    await notes.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<NotesSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await notes.findOne({ guildId });

    if (!raw) return null;

    const schema = new NotesSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawNotesSchema
  ): Promise<NotesSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await notes.insertOne(data);

    const raw = await notes.findOne({ _id: insertedId });

    const schema = new NotesSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawNotesSchema
  ): Promise<NotesSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<Snowflake, NotesSchema>();
}
