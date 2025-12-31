import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItemGroup, IonLabel, IonItemDivider, IonItem, IonToggle, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilePreviewComponent } from "@app/profiles/profile-preview-component/profile-preview.component";
import { LoadingService } from '@app/loading/loading-service/loading.service';
import { ConversationService } from '../conversation.service';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Profile } from '@app/profiles/profile.interface';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ItemButtonComponent } from '@app/shared/inputs/item-button-component/item-button.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { ItemToggleComponent } from "@app/shared/inputs/item-toggle-component/item-toggle.component";

@Component({
  selector: 'app-conversation-settings',
  templateUrl: './conversation-settings.page.html',
  styleUrls: ['./conversation-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonItemGroup, IonLabel, IonItemDivider,
    CommonModule, FormsModule, TranslatePipe, RouterLink,
    ProfilePreviewComponent, LoadingIndicator, ItemButtonComponent, StandardHeaderComponent, ItemToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSettingsPage {

  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private conversationSerivce = inject(ConversationService);
  private profileService = inject(ProfileService);
  protected alertService = inject(AlertService);

  protected dataLoaded = this.loadingService.dataLoaded;
  protected conversationId!: number;
  protected participant?: Profile;

  IonViewWillEnter() {
    this.loadingService.setDataSources(this.conversationSerivce, this.profileService);
  }

  constructor() {
    let idStr = this.route.snapshot.paramMap.get('id');
    if (idStr === null || isNaN(parseInt(idStr))) {
      this.loadingService.reportError("bad-url");
      return;
    }

    if (this.dataLoaded()) this.finishLoading(idStr);
    else effect(() => { if (this.dataLoaded() && !this.participant) this.finishLoading(idStr); })
  }

  private finishLoading(conversationIdStr: string) {
    this.conversationId = parseInt(conversationIdStr);
    let conversation = this.conversationSerivce.getConversationIfExists(this.conversationId);
    if (!conversation) {
      this.loadingService.reportError("not-found");
      return;
    }

    this.participant = this.profileService.getProfileIfExists(conversation?.participantId);
    if (!this.participant) this.loadingService.reportError("not-found");
  }
}
