import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Profile, ServerUserProfile, UserProfile } from '@app/profiles/profile.interface';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { BackendProfileApi } from './backend-profile-api';
import { AlertType } from '@src/app/alerts/alert-type.enum';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  // Dependencies
  private readonly api = new BackendProfileApi();
  private readonly alertService = inject(AlertService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  public readonly profiles = signal(new Map<number, Profile>());
  public readonly profilesLoaded = signal<boolean>(false);
  // public readonly loadErrorCode: WritableSignal<number | null> = signal(null);

  constructor() {
    this.loadData().subscribe();
  }

  loadData() {
    return forkJoin({
      profiles: this.api.getUserKnownProfiles(),
      currentProfile: this.api.getCurrentProfile()
    }).pipe(
      tap(({ profiles, currentProfile }) => {
        this.profiles.set(profiles);
        this.profiles().set(currentProfile.id, currentProfile);
        this.profilesLoaded.set(true);
      })
    );
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

  public updateNick(profileId: number, newNick: string) {
    return this.api.updateNick(profileId, newNick).pipe(
      tap(() => {
        let existing = this.profiles().get(profileId);
        if (!existing || existing.type !== 'user') return;

        existing.nick = newNick;

        this.updateProfileInMemory(existing);
      }),
    );
  }

  public promptBlockUser(profileId: number) {
    this.alertService.displayPromptAlert(
      AlertType.DANGER_PROMPT,
      this.translate.instant("prompt.block.user"),
      () => {
        this.setUserBlocked(profileId, true);
        if (this.router.url.startsWith("/chats/") || this.router.url.startsWith("/profiles/"))
          this.router.navigateByUrl("/chats");
      },
      undefined,
      this.translate.instant("profile.block"),
      this.translate.instant("common.are-you-sure")
    );
  }

  public promptUnblockUser(profileId: number, login?: string) {
    this.alertService.displayPromptAlert(
      AlertType.PROMPT,
      this.translate.instant("prompt.unblock"),
      () => this.setUserBlocked(profileId, false),
      undefined,
      login ?? undefined
    );
  }

  private setUserBlocked(profileId: number, blocked: boolean) {
    const existing = this.profiles().get(profileId);
    if (!existing || existing.type !== 'user') return;

    const endpoint = blocked ? this.api.blockUser(profileId) : this.api.unblockUser(profileId);

    endpoint.subscribe({
      next: () => {
        let p = this.profiles().get(profileId);
        if (!p || p.type !== 'user') return;
        p.blocked = blocked;
        this.updateProfileInMemory(p);
      },
      error: (err) => this.alertService.displayError(err.error.message ?? err.status ?? "unknown")
    });
  }

  private updateProfileInMemory(updatedProfile: Profile) {
    const itemCopy = {...updatedProfile};
    this.profiles().set(updatedProfile.id, itemCopy);
    let arrayCopy = [...this.profiles()];
    this.profiles.set(new Map(arrayCopy));
  }
}