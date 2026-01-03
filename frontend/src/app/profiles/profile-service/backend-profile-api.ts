import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { Profile, ServerUserProfile, UserProfile } from "../profile.interface";
import { mapUserProfile, mapProfileList } from "../profile-utils";
import { map, tap } from "rxjs";



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

  getProfileById(id: number) {
    return this.http.get<ServerUserProfile>(`/profiles/${id}`).pipe(
      map(mapUserProfile)
    );
  }

  getSearchedProfiles(search: string) {
    return this.http.get<ServerUserProfile[]>(`/profiles/search?q=${encodeURIComponent(search)}`).pipe(
      map(mapProfileList)
    );
  }

  editOwnProfile(profileChanges: Partial<ServerUserProfile>) {
    return this.http.patch<ServerUserProfile>("/profiles/me", profileChanges).pipe(
      map(mapUserProfile)
    );
  }

  updateNick(profileId: number, newNick: string) {
    return this.http.patch(`/profiles/${profileId}/nick`, { nick: newNick });
  }
}
