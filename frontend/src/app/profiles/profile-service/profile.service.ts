import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { Profile, UserProfile, GroupProfile } from '@app/profiles/profile.interface';
import { BackendProfileApi } from './backend-profile-api';
import { forkJoin } from 'rxjs';
import { ConversationService } from '@app/conversations/conversation.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService implements LoadingStatus {

  // Dependencies
  private readonly api = new BackendProfileApi();

  public readonly profiles = signal(new Map<number, Profile>());
  public readonly dataLoaded = signal<boolean>(false);
  public readonly loadErrorCode: WritableSignal<number | null> = signal(null);

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
        this.dataLoaded.set(true);
      },
      error: (e) => {
        console.error("Error loading data:", e);
        this.loadErrorCode.set(e.status);
      }
    });
  }

  public getProfile(id: number): Profile {
    let found = this.profiles().get(id);
    if (found === undefined) throw new Error("getProfile(): ID not found. Call getProfileIfExists() if you permit the undefined value");
    return found;
  }

  public getProfileIfExists(id: number): Profile | undefined {
    return this.profiles().get(id);
  }

  public getProfiles(): Map<number, Profile> {
    if (!this.dataLoaded()) throw new Error("Profiles not loaded - service users should check that first");
    return this.profiles();
  }

  public getPublicUserProfiles(search: string) {
    return this.api.getSearchedProfiles(search);
  }
}
