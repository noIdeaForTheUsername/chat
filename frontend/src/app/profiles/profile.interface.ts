export interface ProfileBase {
  type: 'user' | 'group',
  id: number,
  profilePicture?: string, // change in the future
  nick?: string,
  bio?: string
}

export interface UserProfile extends ProfileBase {
  type: 'user',
  login: string,
  name?: string,  // may include surname
}

export interface GroupProfile extends ProfileBase {
  type: 'group',
  name: string,
}

export type Profile = UserProfile | GroupProfile;