export interface ProfileBase {
  type: 'user' | 'group',
  id: number,
  profilePicture?: string, // not implemented; probably to be removed
  bio?: string
}

export interface OwnProfile extends ProfileBase {
  type: 'user',
  login: string,
  name?: string,  // may include surname
}

export interface UserProfile extends ProfileBase {  // only not-own
  type: 'user',
  login: string,
  nick?: string,
  name?: string,  // may include surname
  blocked: boolean,
}

export interface GroupProfile extends ProfileBase {
  type: 'group',
  name: string,
}

export type Profile = UserProfile | GroupProfile;

export type ServerUserProfile = Omit<UserProfile, "type">;