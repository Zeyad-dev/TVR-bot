import { InviteData } from "../schemas/inviteTracker";

export interface data {
  inviteCode: string;
  uses: number;
}

export function findDifferentUses(arr1: InviteData[], arr2: data[]): string[] {
  const differentInviteCodes: string[] = [];

  arr1.forEach((invite1) => {
    const invite2 = arr2.find((i) => i.inviteCode === invite1.code);
    if (invite2 && invite2.uses !== invite1.uses) {
      differentInviteCodes.push(invite1.code);
    }
  });

  return differentInviteCodes;
}
