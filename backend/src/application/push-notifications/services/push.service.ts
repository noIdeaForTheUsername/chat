import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { Repository } from "typeorm";
import { FcmService } from "./fcm.service";
import { WebPushService } from "./web-push.service";
import { getNormalizedLang, getNotificationTitleString } from "../strings/notification-strings-utils";

// PushService is the orchestrator while Fcm and WebPush services actually send the notifications

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
      // prepare data
      const normalizedLang = getNormalizedLang(session.language);
      const titleStr = getNotificationTitleString(payload.header, normalizedLang);
      const messageStr = getNotificationTitleString(payload.message, normalizedLang);

      // send
      if (session.pushSubscription) {
        this.webPushService.sendNotification(session, titleStr, messageStr, normalizedLang, this.notificationTTL, payload.tag);
      }
      else if (session.fcmToken) {
        this.fcmService.sendNotification(session, titleStr, messageStr, normalizedLang, this.notificationTTL, payload.tag);
      }
    }
  }
}