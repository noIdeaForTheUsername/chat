import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { Repository } from "typeorm";
import { FcmService } from "./fcm.service";
import { WebPushService } from "./web-push.service";


@Injectable()
export class PushService {

  private readonly notificationTTL = 48 * 3600;

  constructor(
    @InjectRepository(SessionEntity)
    private sessions: Repository<SessionEntity>,
    private webPushService: WebPushService,
    private fcmService: FcmService,
  ) {}


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    await this.sendNotificationsToUser(payload);
  }

  async sendNotificationsToUser(payload: PushNotifcationEvent)
  {
    // get subscription
    const sessions = await this.sessions.findBy({ userId: payload.userId });
    for (const session of sessions) {
      if (session.pushSubscription) {
        /*await*/ this.webPushService.sendNotification(session, payload.header, payload.message, this.notificationTTL, payload.tag, session.language ?? "en");
      }
      else if (session.fcmToken) {
        // Handle FCM notifications
        await this.fcmService.sendNotification(session, payload.header, payload.message, this.notificationTTL, payload.tag, session.language ?? "en");
      }
    }
  }
}