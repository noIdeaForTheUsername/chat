import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Capacitor } from "@capacitor/core";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "../alerts/alert-service/alert.service";
import { AlertType } from "../alerts/alert-type.enum";
import { FcmNotificationsService } from "./internal/fcm-notifications.service";
import { WebPushService } from "./internal/webpush-service";

@Injectable({
  providedIn: "root"
})
export class NotificationsService {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private swPush = inject(SwPush);
  private webPush = inject(WebPushService);
  private fcm = inject(FcmNotificationsService);
  private _notificationsSetting = signal(true);

  public readonly notificationsSupported = Capacitor.isNativePlatform() || this.swPush.isEnabled;
  // the below one refers to the app-level user settings, not browser permissions or actual subscription status
  public readonly notificationsSetting = this._notificationsSetting.asReadonly();

  constructor() {
    this.loadNotificationsSetting();
  }

  async getPermissionStatus() {
    if (Capacitor.getPlatform() == "android") {
      try {
        let permission = await this.fcm.getPermissionStatus();
        if (permission != "denied" && permission != "granted")
          return "default";
        else
          return permission;
      }
      catch (err) {
        console.error("Error getting permission status in FcmNotificationsService:", err);
        return "default";
      }
    }
    else if (Capacitor.getPlatform() === "web") {
      return Notification.permission;
    }
    else {  // fallback
      return "denied";
    }
  }

  // Turns notifications on or off while taking care of permissions and subscriptions
  async toggleNotifications(enabled: boolean) {
    this._notificationsSetting.set(enabled);
    try {
      localStorage.setItem("notificationsSetting", enabled.toString());
    } catch (err) {
      console.error("Error occurred while saving notifications setting:", err);
    }

    if (enabled)
      await this.requestAndSendSubscription(true);
    else
      await this.unsubscribeFromNotifications();
  }


  // Checks permission and user settings and sends subscription in background (no UI prompts), only if granted and enabled
  async tryRefresingSubscription() {
    if (!this._notificationsSetting())
      return;

    if (Capacitor.getPlatform() == "android") {
      await this.fcm.sendSubscriptionIfGranted();
    }
    else if (Capacitor.getPlatform() === "web") {
      await this.webPush.sendSubscriptionIfGranted();
    }
  }
  

  // asks user for permission and sends subscription if granted
  private async requestAndSendSubscription(displayAlerts: boolean = true) {
    if (Capacitor.getPlatform() == "android") {
      try {
        await this.fcm.requestAndSendSubscription(displayAlerts);
      }
      catch (err) {
        console.error("Error in requestAndSendSubscription in FcmNotificationsService:", err);
      }
    }
    else {
      await this.webPush.requestAndSendSubscription(displayAlerts);
    }
  }

  private async unsubscribeFromNotifications(){
    return this.http.put("/notifications/subscription",
      {}  // empty body in PUT removes the subscription on the server
    ).subscribe({
      next: () => {
        this.alertService.displayMessageAlert(
          AlertType.INFO,
          this.translate.instant("prompt.notifications-changed")
        );
      },
      error: (err) => {
        this.alertService.displayError(err.status);
      }
    });
  }

  private async loadNotificationsSetting() {
    try {
      let storedNotificationsSetting = localStorage.getItem("notificationsSetting");
      if (storedNotificationsSetting === null) {
        storedNotificationsSetting = "true";
        localStorage.setItem("notificationsSetting", storedNotificationsSetting);
      }
      this._notificationsSetting.set(storedNotificationsSetting === "true");
    } catch (err) {
      console.error("Error occurred while loading notifications setting:", err);
    }
  }
}