import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItemGroup, IonLabel, IonItemDivider, IonItem, IonToggle, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfilePreviewComponent } from "@app/profiles/profile-preview-component/profile-preview.component";
import { ConversationService } from '../conversation.service';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Profile } from '@app/profiles/profile.interface';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ItemButtonComponent } from '@app/shared/inputs/item-button-component/item-button.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { ItemToggleComponent } from "@app/shared/inputs/item-toggle-component/item-toggle.component";
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { AlertType } from '@app/alerts/alert-type.enum';

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

  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private conversationSerivce = inject(ConversationService);
  private profileService = inject(ProfileService);
  protected alertService = inject(AlertService);
  private router = inject(Router);

  protected conversationId!: number;
  protected participantId!: number;
  protected participant = signal<Profile | undefined>(undefined);
  protected dataLoaded = signal(false);
  protected loadError = signal<string | number | null>(null);


  constructor() {
    let idStr = this.route.snapshot.paramMap.get('id');
    this.conversationId = parseInt(idStr ?? "a");
    if (idStr === null || isNaN(this.conversationId)) {
      this.loadError.set("bad-url");
      return;
    }

    this.loadData(this.conversationId);
    effect(() => {
      const _ = this.profileService.profiles();
      if (this.participantId)
        this.loadParticipant(this.participantId);
    });
  }

  private async loadData(conversationId: number) {
    try {
      const conversation = await lastValueFrom(this.conversationSerivce.getConversationById(conversationId));
      this.participantId = conversation.participantId;
      await this.loadParticipant(this.participantId);
      this.dataLoaded.set(true);
    }
    catch (error) {
      this.loadError.set("data-unavailable");
    }
  }
  private async loadParticipant(participantId: number) {
    this.participant.set(await lastValueFrom(this.profileService.getProfileById(participantId)));
  }

  protected promptClearConversation() {
    this.alertService.displayPromptAlert(
      AlertType.DANGER_PROMPT,
      this.translate.instant('prompt.clear-conversation'),
      () => this.clearConversation()
    )
  };

  protected promptBlockUser() {
    const participant = this.participant();
    if (!participant || participant.type !== "user") return;
    this.profileService.promptBlockUser(participant.id);
  }

  private clearConversation() {
    this.conversationSerivce.clearConversationMessages(this.conversationId);
    this.router.navigate(['/chats']);
  }
}
