import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { Repository } from "typeorm";
import * as webpush from "web-push";

@Injectable()
export class PushService {

  private vapidKeys: { publicKey: string; privateKey: string };

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
    console.log("VAPID contact:", contact);

    webpush.setVapidDetails(
      contact,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    await this.sendNotificationsToUser(payload.userId, payload.header, payload.message, payload.tag, payload.clickUrl);
  }

  async sendNotificationsToUser(userId: number, title: string, message: string,
    tag?: string, clickUrl?: string
  ) {
    console.log("trying to send push notification to user ", userId);
    // get subscription
    const sessions = await this.deviceSessions.findBy({ userId });
    for (const session of sessions) {
      await this.sendSingleNotification(session, title, message, tag, clickUrl);
    }
  }

  private async sendSingleNotification(session: DeviceSessionEntity, title: string, message: string,
    tag?: string, clickUrl?: string) {
    const subscription = session.pushSubscription;
    console.log("sub found: ", subscription);
    if (!subscription) {
      return;
    }

    // prepare payload
    const payload = {
      "notification": {
        "title": "CHAT | " + title,
        "body": message,
        "tag": tag,
        "data": {
          "onActionClick": {
            "default": { "operation": "navigateLastFocusedOrOpen", "url": clickUrl ?? "/chats" }
          }
        }
      }
    }

    // send
    try {
      await webpush.sendNotification(subscription as any, JSON.stringify(payload));
    } catch (error) {
      console.warn("error sending webpush notification: ", error);
      // on error remove the subscription
      this.deviceSessions.update(
        { sid: session.sid },
        { pushSubscription: null }
      );
    }
  }
}