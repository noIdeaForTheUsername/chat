import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { environment } from "@src/environments/environment";
import { AlertService } from "../alerts/alert-service/alert.service";
import { AlertType } from "../alerts/alert-type.enum";
import { lastValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class NotificationsService {
  private swPush = inject(SwPush);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);

  constructor() {
    console.log("NotificationsService initialized");
  }

  // This function doesn't do anything if permissions are not granted. Returns success status
  async sendSubscriptionIfAvailable(): Promise<boolean> {
    if (Notification.permission === "granted") {
      console.log("Notification permission granted. Getting existing sub...");
      const existingSub = await this.getExistingSubscription();
      console.log("Existing subscription:", existingSub);
      if (existingSub) {
        this.sendSubscriptionToServer(existingSub);
      }
      else {
        await this.requestSubscriptionAndSend(false);
      }
      return true;
    }
    else return false;
  }
  
  // This function asks for permissions if not already granted and shows an alert if denied
  async requestSubscriptionAndSend(alertOnError: boolean = true): Promise<void> {
    let sub: PushSubscription | undefined = undefined;
    try {
      console.log("Requesting notification subscription...");
      sub = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey
      });
      console.log("Subscription obtained: ", sub);
      console.log("Typeof endpoint: ", typeof sub.endpoint);
    }
    catch(err) {
      console.error("Error requesting subscription:", err);
      if (alertOnError) this.alertService.displayError("notifications-blocked");
    }

    console.log("Obtained subscription:", sub);

    if (sub) {
      this.sendSubscriptionToServer(sub);
    }
  }

  private async getExistingSubscription() {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  private sendSubscriptionToServer(subscription: PushSubscription) {
    console.log("Sending subscription to server:", subscription);
    this.http.post("/notifications/subscribe", subscription).subscribe();
  }
}