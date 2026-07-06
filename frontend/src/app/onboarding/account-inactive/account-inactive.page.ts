import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { RouterLink } from '@angular/router';
import { NotificationsService } from '@src/app/notifications/notifications.service';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';
import { isAndroid } from '@src/app/shared/platform-detection/platformUtils';
import { AndroidInstallationComponent } from '../android-installation-component/android-installation.component';

@Component({
  selector: 'app-account-inactive',
  templateUrl: './account-inactive.page.html',
  styleUrls: ['./account-inactive.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule, StandardHeaderComponent, RouterLink, AndroidInstallationComponent,
    TranslatePipe, IonButton, IonButtons, LanguageButtonComponent, RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
})
export class AccountInactivePage {

  protected alertService = inject(AlertService);
  protected notificationsService = inject(NotificationsService);

  protected runningAsPwa = signal(false);
  protected androidAppAvailable = signal(false);

  protected reloadPage() {
    window.location.reload();
  }

  ionViewWillEnter() {
    this.runningAsPwa.set(
      window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    );
    this.androidAppAvailable.set(isAndroid());
  }
}
