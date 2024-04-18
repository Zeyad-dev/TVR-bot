import { Collection, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export interface RawStaffMembersSchema {
  guildId: Snowflake;
  forNotes: Snowflake[];
  forWarns: Snowflake[];
}

const StaffMembers = database.collection<RawStaffMembersSchema>("staffMembers");

export class StaffMembersSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawStaffMembersSchema>
  ) {}

  public async update(data: Partial<RawStaffMembersSchema>): Promise<this> {
    await StaffMembers.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<StaffMembersSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await StaffMembers.findOne({ guildId });

    if (!raw) return null;

    const schema = new StaffMembersSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawStaffMembersSchema
  ): Promise<StaffMembersSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await StaffMembers.insertOne(data);

    const raw = await StaffMembers.findOne({ _id: insertedId });

    const schema = new StaffMembersSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawStaffMembersSchema
  ): Promise<StaffMembersSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<
    Snowflake,
    StaffMembersSchema
  >();
}
