import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { AnyProfile, OwnProfile, Profile } from "../profile.interface";
import { map, tap } from "rxjs";
import { mapProfileList } from "../profile-utils";



export class BackendProfileApi {
  
  private readonly http = inject(HttpClient);
  

  getCurrentProfile() {
    return this.http.get<OwnProfile>("/profiles/me");
  }

  getUserKnownProfiles() {
    return this.http.get<Profile[]>("/profiles").pipe(
      map(mapProfileList)
    );
  }

  getProfileById(id: number) {
    return this.http.get<AnyProfile>(`/profiles/${id}`);
  }

  getSearchedProfiles(search: string) {
    return this.http.get<Profile[]>(`/profiles/search?q=${encodeURIComponent(search)}`).pipe(
      map(mapProfileList)
    );
  }

  editOwnProfile(profileChanges: Partial<OwnProfile>) {
    return this.http.patch<OwnProfile>("/profiles/me", profileChanges);
  }

  updateNick(profileId: number, newNick: string) {
    return this.http.patch<Profile>(`/profiles/${profileId}/nick`, { nick: newNick });
  }

  blockUser(profileId: number) {
    return this.http.post(`/profiles/${profileId}/block`, {});
  }

  unblockUser(profileId: number) {
    return this.http.post(`/profiles/${profileId}/unblock`, {});
  }
}
