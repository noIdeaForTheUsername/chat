import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";
import { environment } from "@src/environments/environment.prod";


@Injectable({
  providedIn: "root"
})
export class WebPushService {
  
  private swPush = inject(SwPush);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private http = inject(HttpClient);
  public readonly notificationsSupported = this.swPush.isEnabled;

  async requestAndSendSubscription(displayAlerts: boolean = true): Promise<void> {
    let sub: PushSubscription | undefined = undefined;
    try {
      sub = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey
      });
    }
    catch(err: any) {
      console.error("Error requesting subscription:", err);
      if (displayAlerts) {
        if (Notification.permission == "denied")
          this.alertService.displayError("notifications-blocked");
        else {
          if (Object.keys(err).length === 0)
            this.alertService.displayError("notifications-unknown-error");
          else
            this.alertService.displayUnknownError(err);
        }
      }
    }

    if (!sub) return;

    this.sendSubscriptionToServer(sub, displayAlerts);
    // if (displayAlerts)
    //   this.alertService.displayMessageAlert(AlertType.INFO, this.translate.instant("prompt.notifications-enabled"));
  }

  private sendSubscriptionToServer(subscription: PushSubscription, displayAlerts: boolean = true): void {
    this.http.put("/notifications/subscription", {
      subscription: subscription,
      language: this.translate.getCurrentLang()
    }).subscribe({
      next: () => {
        if (displayAlerts)
          this.alertService.displayMessageAlert(AlertType.INFO, this.translate.instant("prompt.notifications-enabled"));
      },
      error: (err) => {
        if (displayAlerts)
          this.alertService.displayError(err.status);
      }
    });
  }
}