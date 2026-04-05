import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FcmNotificationsService } from "./internal/fcm-notifications.service";
import { WebPushService } from "./internal/webpush-service";
import { HttpClient } from "@angular/common/http";
import { language } from "ionicons/icons";
import { AlertService } from "../alerts/alert-service/alert.service";
import { AlertType } from "../alerts/alert-type.enum";
import { TranslateService } from "@ngx-translate/core";

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
  public readonly notificationsSupported = Capacitor.isNativePlatform() || this.swPush.isEnabled;


  // This function doesn't do anything if permissions are not granted. Returns success status
  async sendSubscriptionIfAvailable(): Promise<boolean> {
    if (Capacitor.getPlatform() == "android") {
      try {
        const permissions = await PushNotifications.checkPermissions();
        if (permissions.receive === "granted") {
          await this.fcm.requestAndSendSubscription(false);
          return true;
        }
      }
      catch (err) {
        console.error("Error in sendSubscriptionIfAvailable in FcmNotificationsService:", err);
      }
    }
    else if (Capacitor.getPlatform() === "web") {
      if (Notification.permission == "granted") {
        await this.webPush.requestAndSendSubscription(false);
        return true;
      }
    }

    return false;
  }

  async requestAndSendSubscription(displayAlerts: boolean = true) {
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

  async unsubscribeFromNotifications(){
    return this.http.put("/notifications/subscription",
      {}  // empty body removes the subscription on the server
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

  async getNotificationsStatus() {
    if (Capacitor.getPlatform() == "android") {
      try {
        let permission = await this.fcm.getPermissionStatus();
        if (permission != "denied" && permission != "granted") {
          return "default";
        }
        return permission;
      }
      catch (err) {
        console.error("Error in getNotificationsStatus in FcmNotificationsService:", err);
        return "default";
      }
    }
    else if (Capacitor.getPlatform() === "web") {
      return Notification.permission;
    }
    else {
      return "denied";
    }
  }
}