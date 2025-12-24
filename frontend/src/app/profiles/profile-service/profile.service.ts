import { Injectable, signal, WritableSignal } from '@angular/core';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { Profile, UserProfile, GroupProfile } from '@app/profiles/profile.interface';
import { MockServer } from '@app/mock-server/mock.server';

@Injectable({
  providedIn: 'root'
})
export class ProfileService implements LoadingStatus {

  public readonly profiles = signal(new Map<number, Profile>());
  public readonly userId: number;
  public readonly dataLoaded = signal<boolean>(false);
  public readonly loadErrorCode: WritableSignal<number | null> = signal(null);

  constructor(private mockServer: MockServer) {
    this.userId = mockServer.userId;
    this.loadData();
  }

  loadData() {
    this.mockServer.apiGetUserKnownProfiles().subscribe({
      next: (val) => {
        this.profiles.set(val);
        this.dataLoaded.set(true);
      },
      error: (e) => {
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
    if (!this.dataLoaded()) throw new Error("Profiles not loaded - service users should check that first!");
    return this.profiles();
  }

  public getPublicUserProfiles(search: string) {
    return this.mockServer.apiGetSearchedProfiles(search);
  }
}
