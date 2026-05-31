import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';
import { LanguageService } from '@app/i18n/language.service';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { Capacitor } from '@capacitor/core';
import { IonAlert, IonContent, IonItemDivider, IonItemGroup, IonLabel, IonSelectOption } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';
import { NotificationsService } from '@src/app/notifications/notifications.service';
import { isPwa } from '@src/app/shared/platform-detection/platformUtils';
import { ItemSelectComponent } from "../../shared/inputs/item-select-component/item-select.component";

@Component({
  selector: 'app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonItemGroup, IonItemDivider, IonLabel, IonSelectOption, IonAlert,
    CommonModule, FormsModule, RouterLink, TranslatePipe, StandardHeaderComponent, ItemButtonComponent, ItemSelectComponent]
})
export class AppSettingsPage {

  protected profileService = inject(ProfileService);
  protected authService = inject(AuthService);
  protected alertService = inject(AlertService);
  protected languageService = inject(LanguageService);
  protected notificationsService = inject(NotificationsService);
  private translate = inject(TranslateService);

  protected runningAsPwa = signal(true);
  protected runningNatively = signal(false);
  protected notificationsSelectValue = signal("...");


  constructor() {
    this.loadNotificationsSelectValue();
  }

  ionViewWillEnter() {
    this.runningAsPwa.set(isPwa());
    this.runningNatively.set(Capacitor.isNativePlatform());
  }

  get languageSelectValue(): string {
    return this.languageService.getCurrent() === 'pl' ? 'polish' : 'english';
  }


  onLanguageSelect(value: string): void {
    const lang = value === 'polish' ? 'pl' : 'en';
    this.languageService.setLanguage(lang);
  }

  async onNotificationsToggle(value: string) {
    let enabled = value.toLowerCase() == 'enabled';
    this.notificationsService.toggleNotifications(enabled);
  }

  private async loadNotificationsSelectValue() {
    if (await this.notificationsService.getPermissionStatus() == "granted"
    && this.notificationsService.notificationsSetting())
      this.notificationsSelectValue.set("enabled");
    else
      this.notificationsSelectValue.set("disabled");
  }


  // Global logout confirmation alert

  protected globalLogoutAlertButtons = [
    {
      text: this.translate.instant('common.cancel'),
      role: 'cancel'
    },
    {
      text: this.translate.instant('common.confirm'),
      role: "confirm"
    }
  ];
  protected globalLogoutInputs = [
    {
      placeholder: this.translate.instant('profile.password'),
      type: "password",
      attributes: {
        maxlength: 100
      }
    }
  ];

  onGlobalLogoutAlertDismiss(event: any) {
    if (event?.detail?.role === 'confirm') {
      this.authService.globalLogout(event.detail.data?.values?.[0]);
    }
  }
}
