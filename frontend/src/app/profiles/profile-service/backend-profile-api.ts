import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { Profile, UserProfile } from "../profile.interface";
import type { ServerUserProfile } from "../profile-utils";
import { mapUserProfile, mapProfileList } from "../profile-utils";
import { map } from "rxjs";



export class BackendProfileApi {
  
  private readonly http = inject(HttpClient);
  

  getCurrentProfile() {
    return this.http.get<ServerUserProfile>("/profiles/me").pipe(
      map(mapUserProfile)
    );
  }

  getUserKnownProfiles() {
    return this.http.get<ServerUserProfile[]>("/profiles").pipe(
      map(mapProfileList)
    );
  }

  getSearchedProfiles(search: string) {
    return this.http.get<ServerUserProfile[]>(`/profiles/search?q=${encodeURIComponent(search)}`).pipe(
      map(mapProfileList)
    );
  }
}
