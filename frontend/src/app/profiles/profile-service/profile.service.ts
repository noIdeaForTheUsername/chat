import { Injectable, signal, WritableSignal } from '@angular/core';
import { Profile, ServerUserProfile, UserProfile } from '@app/profiles/profile.interface';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { BackendProfileApi } from './backend-profile-api';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  // Dependencies
  private readonly api = new BackendProfileApi();

  public readonly profiles = signal(new Map<number, Profile>());
  public readonly profilesLoaded = signal<boolean>(false);
  // public readonly loadErrorCode: WritableSignal<number | null> = signal(null);

  constructor() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      profiles: this.api.getUserKnownProfiles(),
      currentProfile: this.api.getCurrentProfile()
    }).subscribe({
      next: ({ profiles, currentProfile }) => {
        this.profiles.set(profiles);
        this.profiles().set(currentProfile.id, currentProfile);
        this.profilesLoaded.set(true);
      }
    });
  }

  public getProfileById(id: number): Observable<Profile> {
    let found = this.profiles().get(id);
    if (found) return of(found);

    // If not found, try to load from backend
    return this.api.getProfileById(id).pipe(
      tap(profile => {
        this.profiles().set(profile.id, profile);
      })
    );
  }

  // public getProfileIfExists(id: number): Profile | undefined {
  //   return this.profiles().get(id);
  // }

  // public getProfiles(): Map<number, Profile> {
  //   if (!this.profilesLoaded()) throw new Error("Profiles not loaded - service users should check that first");
  //   return this.profiles();
  // }

  public getPublicUserProfiles(search: string) {
    return this.api.getSearchedProfiles(search);
  }

  public editOwnProfile(profileChanges: Partial<ServerUserProfile>) {
    return this.api.editOwnProfile(profileChanges).pipe(
      tap(updatedProfile => {
        this.profiles.update(profiles => {
          profiles.set(updatedProfile.id, updatedProfile);
          return profiles;
        });
      })
    );
  }

}