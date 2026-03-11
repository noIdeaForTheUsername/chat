import { Injectable } from "@nestjs/common";
import { notificationStrings } from "../strings/notification-strings";
import { InjectRepository } from "@nestjs/typeorm";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";
import { Repository } from "typeorm";
import * as webpush from "web-push";
import { ConfigService } from "@nestjs/config";
import { getNormalizedLang, getNotificationTitleString, getTranslatedString } from "../strings/notification-strings-utils";


@Injectable()
export class WebPushService {

  private readonly vapidKeys: { publicKey: string; privateKey: string };

  constructor(
    private config: ConfigService,
    @InjectRepository(DeviceSessionEntity)
    private sessionsRepository: Repository<DeviceSessionEntity>,
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

  

  public async sendNotification(session: DeviceSessionEntity, title: string | string[], message: string | string[],
    ttl: number, tag?: string, language?: string) {
    const subscription = session.pushSubscription;
    if (!subscription) {
      return;
    }

    const normalizedLang = getNormalizedLang(language);
    const titleStr = getNotificationTitleString(title, normalizedLang);
    const messageStr = getTranslatedString(normalizedLang, message);

    // prepare payload
    const payload = {
      "notification": {
        "title": titleStr,
        "body": messageStr,
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
      await webpush.sendNotification(subscription as any, JSON.stringify(payload), {
        TTL: ttl,
        urgency: "high"
      });
    } catch (error) {
      // on error remove the subscription
      await this.sessionsRepository.update(session.sid, {
        pushSubscription: null
      });
    }
  }

  
}