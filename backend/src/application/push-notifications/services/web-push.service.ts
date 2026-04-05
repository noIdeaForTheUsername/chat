import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { SessionsService } from "src/domain/session/sessions.service";
import * as webpush from "web-push";
import { notificationStrings } from "../strings/notification-strings";


@Injectable()
export class WebPushService {

  private readonly vapidKeys: { publicKey: string; privateKey: string };

  constructor(
    private config: ConfigService,
    private sessionsService: SessionsService,
  ) {
    this.vapidKeys = {
      publicKey: this.config.get<string>("pushNotifications.vapidPublicKey")!,
      privateKey: this.config.get<string>("pushNotifications.vapidPrivateKey")!,
    }

    const contact = `${this.config.get<string>("pushNotifications.vapidContact")!}`;

    webpush.setVapidDetails(
      contact,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  

  public async sendNotification(session: SessionEntity, title: string, message: string,
    normalizedLang: string, ttl: number, tag?: string) {
    const subscription = session.pushSubscription;
    if (!subscription) {
      return;
    }

    // prepare payload
    const payload = {
      "notification": {
        "title": title,
        "body": message,
        "tag": tag,
        "icon": "assets/icons/icon-256.webp",
        "badge": "assets/icons/badge.png",
        "lang": normalizedLang,
        "data": {
          "onActionClick": {
            "default": { "operation": "focusLastFocusedOrOpen", "url": /*clickUrl ??*/ notificationStrings.homePage }
          }
        }
      }
    }

    // send
    try {
      console.log("notif sending");
      await webpush.sendNotification(subscription as any, JSON.stringify(payload), {
        TTL: ttl,
        urgency: "high"
      });
    } catch (error) {
      console.log("err sending");
      // on error remove the subscription
      try {
        await this.sessionsService.removeWebPushSubscription(session.sid);
      } catch (e) {
        console.error("Failed to remove Web Push subscription from DB after send error: ", e);
      }
    }
  }
}