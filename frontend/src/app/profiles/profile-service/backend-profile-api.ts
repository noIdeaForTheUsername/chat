import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { Profile, UserProfile } from "../profile.interface";
import { map } from "rxjs";

type ServerUserProfile = Omit<UserProfile, "type">;

export class BackendProfileApi {
  
  private readonly http = inject(HttpClient);

  mapProfile(profile: ServerUserProfile): UserProfile {
    console.log("mapProfile called");
    return {
      type: 'user' as const,
      ...profile,
    };
  }
  
  mapProfileList(profiles: ServerUserProfile[]) {
    let profileMap = new Map<number, UserProfile>();
    profiles.forEach((profile) => {
      console.log("mapProfileList called");
      const convertedProfile = {
        type: 'user' as const,
        ...profile,
      };
      profileMap.set(profile.id, convertedProfile);
    });
    return profileMap;
  }

  getCurrentProfile() {
    return this.http.get<ServerUserProfile>("/profiles/me").pipe(
      map(this.mapProfile)
    );
  }

  getUserKnownProfiles() {
    return this.http.get<ServerUserProfile[]>("/profiles").pipe(
      map(this.mapProfileList)
    );
  }

  getSearchedProfiles(search: string) {
    return this.http.get<ServerUserProfile[]>(`/profiles/search?q=${encodeURIComponent(search)}`).pipe(
      map(this.mapProfileList)
    );
  }
}
