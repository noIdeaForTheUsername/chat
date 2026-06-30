import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "src/domain/session/sessions.service";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { FcmService } from "./fcm.service";
import { WebPushService } from "./web-push.service";
import { StringsService } from "src/application/shared/strings/strings.service";
import { StringTemplate } from "src/application/shared/strings/string-params";

// PushService is the orchestrator while Fcm and WebPush services actually send the notifications

@Injectable()
export class PushService {

  private readonly notificationTTL = 48 * 3600;

  constructor(
    private sessionsService: SessionsService,
    private webPushService: WebPushService,
    private fcmService: FcmService,
    private strings: StringsService
  ) {}


  @OnEvent("pushNotification")
  async handlePushNotificationEvent(payload: PushNotifcationEvent) {
    await this.sendNotificationsToUser(payload);
  }


  async sendNotificationsToUser(payload: PushNotifcationEvent)
  {
    const sessions = await this.sessionsService.getUserSessions(payload.userId);
    for (const session of sessions) {
      const normalizedLang = this.strings.getNormalizedLang(session.language);
      payload.header = this.normalizeString(payload.header, normalizedLang);
      payload.message = this.normalizeString(payload.message, normalizedLang);

      if (session.pushSubscription) {
        console.log("performing sendNotification for user", payload.userId, "session", session.sid);
        this.webPushService.sendNotification(session, payload.header, payload.message,
          normalizedLang, this.notificationTTL, payload.tag);
      }
      else if (session.fcmToken) {
        this.fcmService.sendNotification(session, payload.header, payload.message,
          normalizedLang, this.notificationTTL, payload.tag);
      }
    }
  }

  private normalizeString(stringOrStringParams: string | StringTemplate, language: 'pl' | 'en'): string {
    if (typeof stringOrStringParams === "object") {
      return this.strings.getFromTemplate(stringOrStringParams, language);
    }
    return stringOrStringParams;
  }
}