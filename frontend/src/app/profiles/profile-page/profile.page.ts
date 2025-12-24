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
import { ConversationService } from '@app/conversations/conversation-service/conversation.service';
import { LoadingService } from '@app/loading/loading-service/loading.service';
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";

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

  private profileService = inject(ProfileService)
  private conversationService = inject(ConversationService)
  private loadingService = inject(LoadingService);
  protected alertService = inject(AlertService);

  // Data
  profile = signal<Profile | undefined>(undefined);
  conversationId = signal<number>(1);
  own = signal(false);
  editMode = signal(false);
  profileSaving = signal(false);

  dataLoaded = this.loadingService.dataLoaded;

  // ---------------------------------------------- LOADING / INIT ----------------------------------------------

  constructor() { 
    let idStr = this.route.snapshot.paramMap.get('id');
    if (idStr === null || isNaN(parseInt(idStr))) {
      this.loadingService.reportError("not-found");
      return;
    }

    this.loadingService.setDataSources(this.conversationService, this.profileService);

    if (this.dataLoaded()) this.finishLoading(idStr);
    else {
      effect(() => {
        if (this.dataLoaded() && this.profile() === undefined) this.finishLoading(idStr);
      });
    }
  }

  private finishLoading(idStr: string) {
    let profile = this.profileService.getProfileIfExists(parseInt(idStr));
    if (profile === undefined) {
      this.loadingService.reportError("not-found");
      return;
    }

    this.profile.set(profile);
    if (profile.id == this.profileService.userId) {
      this.own.set(true);
    }
    else {
      let conv = this.conversationService.getConversationByParticipantId(parseInt(idStr), this.profile()?.type);
      this.conversationId.set(conv.id);
    }
  }

  // ---------------------------------------------- UI ACTIONS ----------------------------------------------

  goToConversationSettingsPage() {
    if (this.conversationId()) this.router.navigate(["chats", this.conversationId().toString(), "options"]);
  }
  
  enterEditMode() {
    if (this.own()) this.editMode.set(true);
  }

  saveOwnProfileChanges() {
    console.log("Saving changes!");  // TODO: implement 
    this.profileSaving.set(true);
    setTimeout(() => this.profileSaving.set(false), 1500);
    this.editMode.set(false);
  }
}
