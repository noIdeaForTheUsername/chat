import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FcmNotificationsService } from "./internal/fcm-notifications.service";
import { WebPushService } from "./internal/webpush-service";

@Injectable({
  providedIn: "root"
})
export class NotificationsService {
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

  async requestAndSendSubscription(displayAlerts: boolean = true): Promise<void> {
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


  // This function asks for permissions if not already granted and shows an alert if denied
  // async requestSubscriptionAndSend(displayAlerts: boolean = true): Promise<void> {
  //   let sub: PushSubscription | undefined = undefined;
  //   try {
  //     sub = await this.swPush.requestSubscription({
  //       serverPublicKey: environment.vapidPublicKey
  //     });
  //   }
  //   catch(err) {
  //     console.error("Error requesting subscription:", err);
  //     if (displayAlerts) {
  //       if (Notification.permission == "denied")
  //         this.alertService.displayError("notifications-blocked");
  //       else
  //         this.alertService.displayUnknownError(err);
  //     }
  //   }

  //   if (sub) {
  //     this.sendSubscriptionToServer(sub);
  //     if (displayAlerts)
  //       this.alertService.displayMessageAlert(AlertType.INFO, this.translate.instant("prompt.notifications-enabled"));
  //   }
  // }

  // private async getExistingSubscription() {
  //   const registration = await navigator.serviceWorker.ready;
  //   return await registration.pushManager.getSubscription();
  // }

  // private sendSubscriptionToServer(subscription: PushSubscription) {
  //   this.http.put("/notifications/subscription", {
  //     subscription,
  //     language: this.translate.getCurrentLang()
  //   }).subscribe();
  // }
}