import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItemGroup, IonItemDivider, IonLabel, IonSelectOption } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { ItemSelectComponent } from "../../shared/inputs/item-select-component/item-select.component";
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';
import { LanguageService } from '@app/i18n/language.service';
import { NotificationsService } from '@src/app/notifications/notifications.service';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';

@Component({
  selector: 'app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonItemGroup, IonItemDivider, IonLabel, IonSelectOption,
    CommonModule, FormsModule, RouterLink, TranslatePipe, StandardHeaderComponent, ItemButtonComponent, ItemSelectComponent]
})
export class AppSettingsPage {

  protected profileService = inject(ProfileService);
  protected authService = inject(AuthService);
  protected alertService = inject(AlertService);
  protected languageService = inject(LanguageService);
  private notificationsService = inject(NotificationsService)

  get languageSelectValue(): string {
    return this.languageService.getCurrent() === 'pl' ? 'polish' : 'english';
  }

  onLanguageSelect(value: string): void {
    const lang = value === 'polish' ? 'pl' : 'en';
    this.languageService.setLanguage(lang);
  }

  requestNotifications() {
    this.notificationsService.requestSubscriptionAndSend();
  }

}
