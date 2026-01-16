import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { send } from "node:process";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";
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

    webpush.setVapidDetails(
      `${this.config.get<string>("pushNotifications.vapidContact")!}`,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  // sendNotification(...params: any[]) {
  //   if (typeof params[0] === "number" && typeof params[1] === "string" && typeof params[2] === "object") {
  //     this.sendNotification1(params[0], params[1], params[2]);
  //   }
  // }

  async sendNotification(userId: number, title: string, message: string) {
    // get subscription
    const session = await this.deviceSessions.findOneBy({ userId });
    const subscription = session?.data?.pushSubscription;
    if (!subscription) return;

    // prepare payload
    const payload = new Notification(title, {
      body: message,
    });

    // send
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.log("error sending webpush notification: ", error);
      // on error remove the subscription
      this.deviceSessions.update(
        { sid: session.sid },
        { pushSubscription: null }
      );
    }
  }
}