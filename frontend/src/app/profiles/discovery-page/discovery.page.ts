import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { LoadingIndicator } from "@app/loading/loading-indicator-component/loading-indicator.component";
import { UserProfile } from '@app/profiles/profile.interface';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { IonAvatar, IonButton, IonContent, IonItem, IonLabel, IonSearchbar } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ProfileService } from '../profile-service/profile.service';
import { ConversationService } from '@app/conversations/conversation.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { getVisibleName } from '../profile-utils';

@Component({
  selector: 'app-discovery-page',
  templateUrl: './discovery.page.html',
  styleUrls: ['./discovery.page.scss'],
  standalone: true,
  // providers: [ProfileService],
  imports: [IonContent, IonSearchbar, IonItem, IonAvatar, IonLabel,
    CommonModule, TranslatePipe, LoadingIndicator, VisibleNamePipe, StandardHeaderComponent, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoveryPage implements OnDestroy {

  // Services
  private profileService = inject(ProfileService);
  private conversationService = inject(ConversationService);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);

  // Signals
  searchBarFilled = signal<boolean>(false);
  searchResults = signal(new Map<number, UserProfile>);
  readonly searchLoading = signal<boolean>(false);

  // Other
  private searchSubscription?: Subscription;
  @ViewChild('searchBar') public searchBar!: IonSearchbar;
  protected getVisibleName = getVisibleName;  // for template use


  displaySearchResults() {
    const input = this.searchBar.value;
    if (typeof input != "string" || input.length == 0) {
      this.searchResults().clear();
      this.searchBarFilled.set(false);
      return;
    }

    this.searchBarFilled.set(true);
    this.searchLoading.set(true);
    this.searchSubscription = this.profileService.getPublicUserProfiles(input).subscribe({
      next: (val) => {
        this.searchResults.set(val);
        this.searchLoading.set(false);
      },
      error: (err) => {
        this.alertService.displayErrorById("0");  // server conn
      }
    });
  }

  initiateConversation(participantId: number, participantName: string) {
    this.alertService.displayPromptAlert(
      AlertType.PROMPT,
      this.translate.instant("prompt.start-conversation"),
      () => setTimeout(() => 
        this.conversationService.createDirectConversation(participantId, true),
        250),
      undefined,
      participantName
    );
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }
}
