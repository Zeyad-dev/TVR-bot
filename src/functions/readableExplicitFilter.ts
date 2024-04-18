import { GuildExplicitContentFilter } from "discord.js";

export function readableExplicitFilter(value: GuildExplicitContentFilter) {
  if (value === 0) return "Off";
  if (value === 1) return "Filter messages from members without roles";
  if (value === 2) return "Filter messages from all members";
}
