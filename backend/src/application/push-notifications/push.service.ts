import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { send } from "node:process";
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
    await this.sendNotification(payload.userId, payload.title, payload.message);
  }

  async sendNotification(userId: number, title: string, message: string) {
    console.log("trying to send push notification to user ", userId);
    // get subscription
    const session = await this.deviceSessions.findOneBy({ userId });
    const subscription = session?.data?.pushSubscription;
    if (!subscription) {
      return;
    }

    // prepare payload
    const payload = {
      "notification": {
        "title": title,
        "body": message,
      }
    }

    // send
    try {
      console.log("sub found, sending...");
      await webpush.sendNotification(subscription, JSON.stringify(payload));
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