import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "src/domain/session/sessions.service";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { getNormalizedLang, getNotificationMessageString } from "../strings/notification-strings-utils";
import { FcmService } from "./fcm.service";
import { WebPushService } from "./web-push.service";

// PushService is the orchestrator while Fcm and WebPush services actually send the notifications

@Injectable()
export class PushService {

  private readonly notificationTTL = 48 * 3600;

  constructor(
    private sessionsService: SessionsService,
    private webPushService: WebPushService,
    private fcmService: FcmService,
    private eventEmitter: EventEmitter2,
  ) {}


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    await this.sendNotificationsToUser(payload);
  }


  async sendNotificationsToUser(payload: PushNotifcationEvent)
  {
    const sessions = await this.sessionsService.getUserSessions(payload.userId);

    for (const session of sessions) {
      // prepare data
      const normalizedLang = getNormalizedLang(session.language);
      const titleStr = getNotificationMessageString(payload.header, normalizedLang);
      const messageStr = getNotificationMessageString(payload.message, normalizedLang);

      // send
      if (session.pushSubscription) {
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