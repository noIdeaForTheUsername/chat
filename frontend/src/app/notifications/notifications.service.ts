import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { environment } from "@src/environments/environment";
import { AlertService } from "../alerts/alert-service/alert.service";
import { AlertType } from "../alerts/alert-type.enum";
import { lastValueFrom } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class NotificationsService {
  private swPush = inject(SwPush);
  private alertService = inject(AlertService);

  // This function doesn't do anything if permissions are not granted. Returns success status
  async sendSubscriptionIfAvailable(): Promise<boolean> {
    if (Notification.permission === "granted") {
      const existingSub = await this.getExistingSubscription();
      if (existingSub) {
        this.sendSubscriptionToServer(existingSub);
      }
      else {
        await this.requestSubscriptionAndSend();
      }
      return true;
    }
    else return false;
  }
  
  // This function asks for permissions if not already granted and shows an alert if denied
  async requestSubscriptionAndSend() {
    try {
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey
      });
      this.sendSubscriptionToServer(sub);
    }
    catch(err) {
      this.alertService.displayError("notifications-blocked");
    }
  }

  private async getExistingSubscription() {
    return await lastValueFrom(this.swPush.subscription);
  }

  private sendSubscriptionToServer(subscription: PushSubscription) {

  }
}