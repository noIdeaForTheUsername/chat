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
import { firstValueFrom } from 'rxjs';
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

  // protected dataLoaded = this.loadingService.dataLoaded;
  protected conversationId!: number;
  protected participant?: Profile;
  protected dataLoaded = signal(false);
  protected loadError = signal<string | number | null>(null);

  // IonViewWillEnter() {
  //   this.loadingService.setDataSources(this.conversationSerivce, this.profileService);
  // }

  constructor() {
    let idStr = this.route.snapshot.paramMap.get('id');
    this.conversationId = parseInt(idStr ?? "a");
    if (idStr === null || isNaN(this.conversationId)) {
      this.loadError.set("bad-url");
      return;
    }

    this.loadData(this.conversationId);
  }

  private async loadData(conversationId: number) {
    try {
      const conversation = await firstValueFrom(this.conversationSerivce.getConversationById(conversationId));
      this.participant = await firstValueFrom(this.profileService.getProfileById(conversation?.participantId));
      this.dataLoaded.set(true);
    }
    catch (error) {
      this.loadError.set("data-unavailable");
    }
  }

  protected promptClearConversation() {
    this.alertService.displayPromptAlert(
      AlertType.DANGER_PROMPT,
      this.translate.instant('prompt.clear-conversation'),
      () => this.clearConversation()
    )
  };

  private clearConversation() {
    this.conversationSerivce.clearConversationMessages(this.conversationId);
    this.router.navigate(['/chats']);
  }
}
