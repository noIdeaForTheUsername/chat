import { HttpClient } from "@angular/common/http";
import { inject, Injectable, OnInit } from "@angular/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";
import { PermissionStatus } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";


@Injectable({
  providedIn: "root"
})
export class FcmNotificationsService {

  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private http = inject(HttpClient);

  private displayAlertOnRegistration = false;

  constructor() {
    if (!Capacitor.isNativePlatform()) return;
    PushNotifications.addListener("registration", (token) => {
      this.sendTokenToServer(token.value, this.displayAlertOnRegistration);
      if (this.displayAlertOnRegistration)
        this.displayAlertOnRegistration = false; // reset to default after registration
    });
  }

  async sendSubscriptionIfGranted() {
    try {
      const permissions = await PushNotifications.checkPermissions();
      if (permissions.receive === "granted") {
        await this.requestAndSendSubscription(false);
      }
    }
    catch (err) {
      console.error("Error in handleAutoSubscriptionSending in FcmNotificationsService:", err);
    }
  }

  async requestAndSendSubscription(displayAlerts: boolean = true): Promise<void> {
    if (!Capacitor.isNativePlatform()) throw new Error("FcmNotificationsService can only be used on native platforms");

    let permission: PermissionStatus | undefined = undefined;
    permission = await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      if (displayAlerts)
        this.alertService.displayError("notifications-blocked");
      return;
    }

    this.displayAlertOnRegistration = displayAlerts;
    await PushNotifications.register();
  }

  async getPermissionStatus() {
    if (!Capacitor.isNativePlatform()) throw new Error("FcmNotificationsService can only be used on native platforms");

    const permission = await PushNotifications.checkPermissions();
    return permission.receive;
  }


  private async sendTokenToServer(token: string, displayAlerts: boolean = true) {
    const permission = await this.getPermissionStatus();
    if (permission !== "granted")  {
      return;
    }

    return this.http.put("/notifications/subscription", {
      fcmToken: token,
      language: this.translate.getCurrentLang()
    }).subscribe({
      next: () => {
        if (displayAlerts)
          this.alertService.displayMessageAlert(AlertType.INFO, this.translate.instant("prompt.notifications-enabled"));
      },
      error: (err) => {
        if (displayAlerts)
          this.alertService.displayUnknownError(err);
      }
    });
  }
}