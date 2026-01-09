import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonItemGroup, IonItemDivider, IonLabel, IonIcon, IonTextarea, IonNote, IonCard, IonCardSubtitle } from "@ionic/angular/standalone";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfilePreviewComponent } from '@app/profiles/profile-preview-component/profile-preview.component';
import { Profile } from '@app/profiles/profile.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ProfileInfoItemComponent } from './profile-info-item/profile-info-item.component';
import { ConversationService } from '@app/conversations/conversation.service';
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { AuthService } from '@app/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { AlertType } from '@src/app/alerts/alert-type.enum';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonItemGroup, IonItemDivider, IonLabel, IonTextarea, IonIcon, IonNote, IonButton,
    TranslatePipe, ProfilePreviewComponent, LoadingIndicator, ProfileInfoItemComponent, RouterLink, IonCard, IonCardSubtitle, ItemButtonComponent, StandardHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {

  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);

  private authService = inject(AuthService);
  private profileService = inject(ProfileService)
  private conversationService = inject(ConversationService)
  protected alertService = inject(AlertService);

  // Data
  protected profile = signal<Profile | undefined>(undefined);
  protected conversationId = signal<number | undefined>(undefined);
  protected own = signal(false);

  // UI state
  protected editMode = signal(false);
  protected profileSaving = signal(false);

  // Input
  protected editedName = signal<string>("");
  protected editedNick = signal<string>("");
  protected editedBio = signal<string>("");

  // Loading
  protected dataLoaded = signal(false);
  protected loadingError = signal<string | number | null>(null);

  // ---------------------------------------------- LOADING / INIT ----------------------------------------------

  constructor() { 
    let idStr = this.route.snapshot.paramMap.get('id');
    if (idStr === null || isNaN(parseInt(idStr))) {
      this.loadingError.set("not-found");
      return;
    }

    this.finishLoading(idStr);
  }

  private finishLoading(idStr: string) {
    this.profileService.getProfileById(parseInt(idStr)).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.editedNick.set((profile.type === "user") ? (profile.nick ?? "") : "");
        this.editedName.set(profile.name ?? "");
        this.editedBio.set(profile.bio ?? "");
        if (profile.id === this.authService.getUserId()) {
          this.own.set(true);
        }
        else {
          this.conversationId.set(this.conversationService.getConversationByParticipantId(
            parseInt(idStr), this.profile()?.type)?.id
          );
        }
        this.dataLoaded.set(true)
      },
      error: (err) => {
        this.loadingError.set(err.status);
      }
    });
  }

  // ---------------------------------------------- UI ACTIONS ----------------------------------------------

  onFieldInput(fieldName: string, value: string | null | undefined) {
    if (!value) value = "";
    switch (fieldName) {
      case "name":
        this.editedName.set(value);
        break;
      case "bio":
        this.editedBio.set(value);
        break;
      case "nick":
        this.editedNick.set(value);
        break;
    }
  }

  goToConversationPage() {
    if (this.conversationId() !== undefined)
      this.router.navigate(["chats", this.conversationId()!.toString()]);
  }

  goToConversationSettingsPage() {
    if (this.conversationId() !== undefined)
      this.router.navigate(["chats", this.conversationId()!.toString(), "options"]);
  }
  
  enterEditMode() {
    if (this.own()) this.editMode.set(true);
  }

  saveOwnProfileChanges() {
    this.editMode.set(false);
    this.profileSaving.set(true);
    this.profileService.editOwnProfile({
      name: this.editedName() || undefined,
      bio: this.editedBio() || undefined
    }).subscribe({
      next: (updatedProfile) => {
        this.profile.update(profile => {
          profile!.name = updatedProfile.name;
          profile!.bio = updatedProfile.bio;
          return profile;
        });
        this.profileSaving.set(false);
      },
      error: (error) => this.alertService.displayErrorById(error.status.toString())
    });
  }

  promptBlockUser() {
    const profile = this.profile();
    if (!profile || this.own() || profile.type !== "user") return;
    this.profileService.promptBlockUser(profile.id);
  }

  private updateNick() {
    const profile = this.profile();
    if (this.own() || !profile || profile.type !== "user")
      return;

    if (profile.nick !== this.editedNick()) {
      this.profileService.updateNick(this.profile()!.id, this.editedNick()).subscribe();
    }
  }

  ionViewWillLeave() {
    this.updateNick();
  }
}
