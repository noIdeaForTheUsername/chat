import { GroupProfile, Profile, ServerUserProfile, UserProfile } from "@app/profiles/profile.interface";


export function getVisibleName(value: Profile | undefined, alwaysIncludeUserLogin: boolean = false): string {
  if (value === undefined) return "○ ○ ○";

  if (value.type == 'user') {
    let toReturn = "";
    if (value.nick) toReturn = value.nick;
    else if (value.name) toReturn = value.name;

    if (toReturn.length > 0) {
      if (alwaysIncludeUserLogin) toReturn += ` (@${value.login})`;
      return toReturn;
    }
    else return value.login;
  }
  else {
    return value.name;
  }
}




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
    bio: profile.bio,
    blocked: profile.blocked,
    nick: profile.nick
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
      || profile.nick?.toLocaleLowerCase().includes(search) || profile.id.toString().includes(search);
  else
    return true;
}
