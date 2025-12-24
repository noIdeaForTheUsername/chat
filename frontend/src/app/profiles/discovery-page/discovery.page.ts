import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList,
  IonSearchbar, IonItem, IonAvatar, IonLabel,  IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { UserProfile } from '@app/profiles/profile.interface';
import { ProfileService } from '../profile-service/profile.service';
import { Subscription } from 'rxjs';
import { LoadingIndicator } from "@app/loading/loading-indicator-component/loading-indicator.component";
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { LoadingService } from '@app/loading/loading-service/loading.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-discovery-page',
  templateUrl: './discovery.page.html',
  styleUrls: ['./discovery.page.scss'],
  standalone: true,
  // providers: [ProfileService],
  imports: [IonContent, IonList, IonSearchbar, IonItem, IonAvatar, IonLabel,
    CommonModule, TranslatePipe, LoadingIndicator, VisibleNamePipe, StandardHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoveryPage implements OnInit, OnDestroy {

  // Services
  private profileService = inject(ProfileService);
  private loadingService = inject(LoadingService);

  // Signals
  searchBarFilled = signal<boolean>(false);
  searchResults = signal(new Map<number, UserProfile>);
  readonly searchLoading = signal<boolean>(false);

  // Other
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.loadingService.setDataSources(this.profileService);
  }

  displaySearchResults(event: Event) {
    const input = (event.target as HTMLIonSearchbarElement).value;
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
        this.loadingService.reportError(err.status);
      }
    });
  }


  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }
}
