import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { Repository } from "typeorm";
import * as webpush from "web-push";
import { notificationStrings } from "./notification-strings";


@Injectable()
export class PushService {

  private readonly vapidKeys: { publicKey: string; privateKey: string };
  private readonly notificationTTL = 48 * 3600;


  constructor(
    private config: ConfigService,
    @InjectRepository(DeviceSessionEntity)
    private deviceSessions: Repository<DeviceSessionEntity>,
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


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    await this.sendNotificationsToUser(payload);
  }

  async sendNotificationsToUser(payload: PushNotifcationEvent)
  {
    // get subscription
    const sessions = await this.deviceSessions.findBy({ userId: payload.userId });
    for (const session of sessions) {
      await this.sendSingleNotification(session, payload.header, payload.message, payload.tag, /*payload.clickUrl,*/ session.language ?? "en");
    }
  }

  private async sendSingleNotification(session: DeviceSessionEntity, title: string | string[], message: string | string[],
    tag?: string, /*clickUrl?: string,*/ language?: string) {
    const subscription = session.pushSubscription;
    if (!subscription) {
      return;
    }

    const normalizedLang = language?.toLowerCase().includes("pl") ? "pl" : "en";
    const titleStr = this.getTranslatedString(normalizedLang, ["prefix", ...title]);
    const messageStr = this.getTranslatedString(normalizedLang, message);

    // prepare payload
    const payload = {
      "notification": {
        "title": titleStr,
        "body": messageStr,
        "tag": tag,
        "icon": "assets/icons/icon256.png",
        "badge": "assets/icons/badge.png",
        "lang": normalizedLang,
        "data": {
          "onActionClick": {
            "default": { "operation": "navigateLastFocusedOrOpen", "url": /*clickUrl ??*/ notificationStrings.homePage }
          }
        }
      }
    }

    // send
    try {
      await webpush.sendNotification(subscription as any, JSON.stringify(payload), {
        TTL: this.notificationTTL,
        urgency: "high"
      });
    } catch (error) {
      // on error remove the subscription
      this.deviceSessions.update(
        { sid: session.sid },
        { pushSubscription: null }
      );
    }
  }


  private getTranslatedString(language: 'pl' | 'en', key: string | string[]): string {
    const langStrings = notificationStrings[language] as any;
    let result = "";

    // single string
    if (typeof key === "string") {
      return langStrings[key] ?? key;
    }

    // array
    for (const entry of key) {
      const translated = langStrings[entry];
      result += translated ?? entry;
    }
    return result;
  }
}