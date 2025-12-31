import { GroupProfile, Profile, UserProfile } from "@app/profiles/profile.interface";

// export function getVisibleName(p: Profile, alwaysIncludeUserLogin: boolean = false): string {
  // if (p.type == 'user') {
  //   let toReturn = "";
  //   if (p.userNick) toReturn = p.userNick;
  //   if (p.name) toReturn = p.name;

  //   if (toReturn.length > 0) {
  //     if (alwaysIncludeUserLogin) toReturn += ` (@${p.login})`;
  //     return toReturn;
  //   }
  //   else return '@' + p.login;
  // }
  // else {
  //   if (p.userNick) return p.userNick;
  //   return p.name;
  // }
// }

export type ServerUserProfile = Omit<UserProfile, "type">;

export function mapUserProfile(profile: ServerUserProfile): UserProfile {
  return {
    type: 'user' as const,
    ...profile,
  };
}

export function mapProfileList(profiles: ServerUserProfile[]) {
  let profileMap = new Map<number, UserProfile>();
  profiles.forEach((profile) => {
    const convertedProfile = mapUserProfile(profile);
    profileMap.set(profile.id, convertedProfile);
  });
  return profileMap;
}


export function serverToClientUserProfile(profile: UserProfile): UserProfile {
  return {
    id: profile.id,
    type: profile.type,
    login: profile.login,
    name: profile.name,
    bio: profile.bio
  };
}

export function serverToClientGroupProfile(profile: GroupProfile): GroupProfile {
  return {
    id: profile.id,
    type: profile.type,
    name: profile.name,
  };
}

export function serverToClientProfile(profile: Profile): Profile {
  if (profile.type == 'group') return serverToClientGroupProfile(profile);
  else return serverToClientUserProfile(profile);
}

export function profileMatchesSearch(profile: Profile | undefined, search: string): boolean {
  search = search.toLocaleLowerCase();
  if (profile === undefined) return false;
  if (profile.type == "user")
    return profile.login.toLowerCase().includes(search) || profile.name?.toLocaleLowerCase().includes(search)
      || profile.id.toString().includes(search);
  else
    return true;
}
