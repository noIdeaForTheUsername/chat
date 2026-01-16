import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { environment } from "@src/environments/environment";
import { AlertService } from "../alerts/alert-service/alert.service";
import { AlertType } from "../alerts/alert-type.enum";

@Injectable({
  providedIn: "root"
})
export class NotificationsService {
  private swPush = inject(SwPush);
  private alertService = inject(AlertService);

  sendSubscriptionIfAvailable() {
    if (Notification.permission === "granted") {
  }
  
  createSubscription() {
    this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey
    })
    .then(sub => this.sendSubscriptionToServer(sub))
    .catch(err => 
      this.alertService.displayError("notifications-blocked")
    );
  }

  sendSubscriptionToServer(subscription: PushSubscription) {

  }
}