import { GuildVerificationLevel } from "discord.js";

export function readableVerificationLevel(value: GuildVerificationLevel) {
  if (value === 0) return "None";
  if (value === 1) return "Low";
  if (value === 2) return "Medium";
  if (value === 3) return "High";
  if (value === 4) return "Very high";
}
