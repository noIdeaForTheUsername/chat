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
import { SessionsService } from "src/domain/session/sessions.service";

// PushService is the orchestrator while Fcm and WebPush services actually send the notifications

@Injectable()
export class PushService {

  private readonly notificationTTL = 48 * 3600;

  constructor(
    private sessionsService: SessionsService,
    private webPushService: WebPushService,
    private fcmService: FcmService,
  ) {}


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    console.log("Push notif: ", payload);
    await this.sendNotificationsToUser(payload);
  }
  

  async sendNotificationsToUser(payload: PushNotifcationEvent)
  {
    const sessions = await this.sessionsService.getUserSessions(payload.userId);

    for (const session of sessions) {
      console.log("sess: ", session);
      // prepare data
      const normalizedLang = getNormalizedLang(session.language);
      const titleStr = getNotificationTitleString(payload.header, normalizedLang);
      const messageStr = getNotificationTitleString(payload.message, normalizedLang);

      // send
      if (session.pushSubscription) {
        console.log('webpush detected');
        this.webPushService.sendNotification(session, titleStr, messageStr,
          normalizedLang, this.notificationTTL, payload.tag);
      }
      else if (session.fcmToken) {
        this.fcmService.sendNotification(session, titleStr, messageStr,
          normalizedLang, this.notificationTTL, payload.tag);
      }
    }
  }
}