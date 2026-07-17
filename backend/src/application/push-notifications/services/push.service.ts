import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "src/domain/session/sessions.service";
import { PushNotifcationEvent } from "src/shared/events/push-notification.event";
import { FcmService } from "./fcm.service";
import { WebPushService } from "./web-push.service";
import { StringsService } from "src/application/shared/strings/strings.service";
import { StringTemplate } from "src/application/shared/strings/string-template";
import { LoggingService } from "src/shared/logging/app-logger";

// PushService is the orchestrator while Fcm and WebPush services actually send the notifications

@Injectable()
export class PushService {

  private readonly notificationTTL = 48 * 3600;

  constructor(
    private sessionsService: SessionsService,
    private webPushService: WebPushService,
    private fcmService: FcmService,
    private strings: StringsService,
    private logger: LoggingService,
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
      const normalizedHeader = this.normalizeString(payload.header, normalizedLang);
      const normalizedMessage = this.normalizeString(payload.message, normalizedLang);

      if (session.pushSubscription) {
        this.webPushService.sendNotification(session, normalizedHeader, normalizedMessage,
          normalizedLang, this.notificationTTL, payload.tag);
      }
      else if (session.fcmToken) {
        this.fcmService.sendNotification(session, normalizedHeader, normalizedMessage,
          normalizedLang, this.notificationTTL, payload.tag);
      }
    }
  }

  private normalizeString(stringOrTemplate: string | StringTemplate, language: 'pl' | 'en'): string {
    if (typeof stringOrTemplate === "object") {
      return this.strings.getFromTemplate(stringOrTemplate, language);
    }
    return stringOrTemplate;
  }
}