import { Collection, Events, type Client, type Snowflake } from "discord.js";
import type { WithId } from "mongodb";
import { database } from "../mongo.js";

export enum EventsEnum {
  ChannelCreate = Events.ChannelCreate,
  ChannelDelete = Events.ChannelDelete,
  ChannelPinsUpdate = Events.ChannelPinsUpdate,
  ChannelUpdate = Events.ChannelUpdate,
  GuildBanAdd = Events.GuildBanAdd,
  GuildBanRemove = Events.GuildBanRemove,
  GuildEmojiCreate = Events.GuildEmojiCreate,
  GuildEmojiUpdate = Events.GuildEmojiUpdate,
  GuildEmojiDelete = Events.GuildEmojiDelete,
  GuildMemberAdd = Events.GuildMemberAdd,
  GuildMemberRemove = Events.GuildMemberRemove,
  GuildMemberUpdate = Events.GuildMemberUpdate,
  GuildRoleCreate = Events.GuildRoleCreate,
  GuildRoleUpdate = Events.GuildRoleUpdate,
  GuildRoleDelete = Events.GuildRoleDelete,
  GuildStickerCreate = Events.GuildStickerCreate,
  GuildStickerUpdate = Events.GuildStickerUpdate,
  GuildStickerDelete = Events.GuildStickerDelete,
  GuildUpdate = Events.GuildUpdate,
  MessageBulkDelete = Events.MessageBulkDelete,
  MessageDelete = Events.MessageDelete,
  MessageUpdate = Events.MessageUpdate,
  ThreadCreate = Events.ThreadCreate,
  ThreadDelete = Events.ThreadDelete,
  ThreadUpdate = Events.ThreadUpdate,
  UserUpdate = Events.UserUpdate,
  WebhooksUpdate = Events.WebhooksUpdate,
}

export interface logsProperties {
  toggled: boolean;
  channel: Snowflake;
}

export type logs = {
  [key in EventsEnum]: logsProperties;
};
export interface RawLogsSchema {
  guildId: Snowflake;
  logs: logs;
}

const logs = database.collection<RawLogsSchema>("logs");

export class LogsSchema {
  private constructor(
    public readonly client: Client<true>,
    public readonly raw: WithId<RawLogsSchema>
  ) {}

  public async update(data: Partial<RawLogsSchema>): Promise<this> {
    await logs.updateOne(
      { _id: this.raw._id },
      { $set: Object.assign(this.raw, data) }
    );

    return this;
  }

  public static async find(
    client: Client<true>,
    guildId: Snowflake
  ): Promise<LogsSchema | null> {
    if (this.cache.has(guildId)) return this.cache.get(guildId)!;

    const raw = await logs.findOne({ guildId });

    if (!raw) return null;

    const schema = new LogsSchema(client, raw);

    this.cache.set(guildId, schema);

    return schema;
  }

  public static async create(
    client: Client<true>,
    data: RawLogsSchema
  ): Promise<LogsSchema> {
    if (this.cache.has(data.guildId)) return this.cache.get(data.guildId)!;

    const { insertedId } = await logs.insertOne(data);

    const raw = await logs.findOne({ _id: insertedId });

    const schema = new LogsSchema(client, raw!);

    this.cache.set(data.guildId, schema);

    return schema;
  }

  public static async get(
    client: Client<true>,
    data: RawLogsSchema
  ): Promise<LogsSchema> {
    return (
      (await this.find(client, data.guildId)) ??
      (await this.create(client, data))
    );
  }

  public static readonly cache = new Collection<Snowflake, LogsSchema>();
}
