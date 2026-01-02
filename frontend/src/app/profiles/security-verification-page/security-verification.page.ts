import { Component, effect, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent,IonIcon, IonCardContent, IonCard, IonCardHeader, IonCardTitle, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Profile } from '@app/profiles/profile.interface';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";

@Component({
  selector: 'app-security-verification-page',
  templateUrl: './security-verification.page.html',
  styleUrls: ['./security-verification.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonCardContent, IonCard, IonCardHeader, IonCardTitle, IonNote,
    FormsModule, TranslatePipe, CommonModule, VisibleNamePipe, LoadingIndicator, StandardHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityVerificationPage {

  // Services
  private profileService = inject(ProfileService);

  // Data
  protected dataLoaded = signal(false);
  protected loadingError = signal<string | null>(null);
  protected otherUserProfile!: Profile;

  
  constructor(private route: ActivatedRoute) { 
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr) this.loadingError.set("bad-url");

    this.profileService.getProfileById(parseInt(idStr!, 10)).subscribe({
      next: (profile) => {
        this.otherUserProfile = profile;
        this.dataLoaded.set(true);
      },
      error: (err) => {
        this.loadingError.set(err.status);
      }
    });

    // else {
    //   effect(() => {
    //     if (this.dataLoaded()) this.otherUserProfile = this.profileService.getProfile(parseInt(idStr!, 10));
    //   });
    // }
  }

}
