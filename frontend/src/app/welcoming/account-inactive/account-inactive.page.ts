import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { RouterLink } from '@angular/router';
import { NotificationsService } from '@src/app/notifications/notifications.service';

@Component({
  selector: 'app-account-inactive',
  templateUrl: './account-inactive.page.html',
  styleUrls: ['./account-inactive.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule, StandardHeaderComponent,
    TranslatePipe, IonButton, IonButtons, LanguageButtonComponent, RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
})
export class AccountInactivePage {

  private notificationsService = inject(NotificationsService);

  requestNotifications() {
    this.notificationsService.requestSubscriptionAndSend();
  }

}
