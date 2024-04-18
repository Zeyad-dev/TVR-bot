import { Channel, ChannelType } from "discord.js";

export function readableChannelType(channel: Channel): string {
  let finalString: string;
  switch (channel.type) {
    case ChannelType.AnnouncementThread: {
      finalString = "Announcement Thread";
      break;
    }
    case ChannelType.DM: {
      finalString = "DM Channel";
      break;
    }
    case ChannelType.GroupDM: {
      finalString = "Group DM Channel";
      break;
    }
    case ChannelType.GuildAnnouncement: {
      finalString = "Announcement Channel";
      break;
    }
    case ChannelType.GuildCategory: {
      finalString = "Category Channel";
      break;
    }
    case ChannelType.GuildForum: {
      finalString = "Forum Channel";
      break;
    }
    case ChannelType.GuildMedia: {
      finalString = "Media Channel";
      break;
    }
    case ChannelType.GuildStageVoice: {
      finalString = "Stage Channel";
      break;
    }
    case ChannelType.GuildText: {
      finalString = "Text Channel";
      break;
    }
    case ChannelType.GuildVoice: {
      finalString = "Voice Channel";
      break;
    }
    case ChannelType.PrivateThread: {
      finalString = "Private Thread Channel";
      break;
    }
    case ChannelType.PublicThread: {
      finalString = "Public Thread Channel";
      break;
    }
  }
  return finalString;
}
