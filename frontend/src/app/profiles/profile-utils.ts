import { AnyProfile, Profile, } from "@app/profiles/profile.interface";


export function getVisibleName(value: AnyProfile | undefined, alwaysIncludePhone: boolean = false): string {
  if (value === undefined) return "○ ○ ○";

  let toReturn = "";
  if ("nick" in value && value.nick)
    toReturn = value.nick;
  else if (value.name)
    toReturn = value.name;

  if (toReturn.length > 0) {
    if (alwaysIncludePhone) toReturn += ` (${value.phoneNumber})`;
    return toReturn;
  }
  else return value.phoneNumber;
}




// export function mapUserProfile(profile: ServerUserProfile): OtherProfile {
//   return {
//     type: 'user' as const,
//     ...profile,
//   };
// }

export function mapProfileList(profiles: Profile[]) {
  let profileMap = new Map<number, Profile>();
  profiles.forEach((profile) => {
    profileMap.set(profile.id, profile);
  });
  return profileMap;
}


// export function serverToClientUserProfile(profile: OtherProfile): OtherProfile {
//   return {
//     id: profile.id,
//     type: profile.type,
//     login: profile.login,
//     name: profile.name,
//     bio: profile.bio,
//     blocked: profile.blocked,
//     nick: profile.nick
//   };
// }

// export function serverToClientGroupProfile(profile: GroupProfile): GroupProfile {
//   return {
//     id: profile.id,
//     type: profile.type,
//     name: profile.name,
//   };
// }

// export function serverToClientProfile(profile: ProfileBase): ProfileBase {
//   if (profile.type == 'group') return serverToClientGroupProfile(profile);
//   else return serverToClientUserProfile(profile);
// }

export function profileMatchesSearch(profile: AnyProfile | undefined, search: string): boolean {
  search = search.toLocaleLowerCase();
  if (profile === undefined) return false;

  return profile.phoneNumber.includes(search)
    || profile.name?.toLocaleLowerCase().includes(search)
    || ("nick" in profile && profile.nick?.toLocaleLowerCase().includes(search))
    || profile.id.toString().includes(search);
}
