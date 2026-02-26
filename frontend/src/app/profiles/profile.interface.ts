export interface OwnProfile {
  id: number,
  phoneNumber: string,
  name?: string,
  bio?: string,
}

export interface Profile {  // only not-own
  id: number,
  phoneNumber: string,
  name?: string,
  bio?: string,

  nick?: string,
  blocked: boolean,
}

export type AnyProfile = Profile | OwnProfile;