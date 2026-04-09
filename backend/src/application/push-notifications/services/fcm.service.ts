import { Injectable } from "@nestjs/common";
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { SessionsService } from "src/domain/session/sessions.service";
import { LoggingService } from "src/shared/logging/app-logger";


@Injectable()
export class FcmService {

  constructor(
    private sessionsService: SessionsService,
    private logger: LoggingService,
  ) {}

  initFcm() {
    const serviceAccountPath = path.join(
      process.cwd(),
      'firebase-private.json',
    );

    if (!fs.existsSync(serviceAccountPath)) {
      this.logger.error('FCM service account JSON NOT FOUND! Get it from Google Firebase Console for push notifications to work.', null, 'FcmService');
      this.logger.error('Expected path:', serviceAccountPath, 'FcmService');
      process.exit(1);
    }

    try {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.logger.log('Firebase Admin initialized successfully', 'FcmService');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error, 'FcmService');
      process.exit(1);
    }
  }

  async sendNotification(session: SessionEntity, title: string, message: string,
    normalizedLang: string, ttl: number, tag?: string) {
    if (!session.fcmToken) {
      this.logger.warn(`No FCM token for session ${session.sid}, skipping FCM notification. This message shouldn't have appeared.`, 'FcmService');
      return;
    }

    const notification = {
      title: title,
      body: message,
      tag: tag,
    };

    const payload: admin.messaging.Message = {
      data: {
        notification: JSON.stringify(notification),
        title: title,
        body: message,
        tag: tag ?? "",
        lang: normalizedLang,
      },
      android: {
        ttl: ttl * 1000,
        priority: "high",
        collapseKey: tag,
        notification: {
          title: title,
          body: message,
          icon: "ic_stat_notification",
          tag: tag
        }
      },
      token: session.fcmToken
    };

    try {
      await admin.messaging().send(payload);
    }
    catch (error) {
      // on error remove the token
      try {
        await this.sessionsService.removeFcmToken(session.sid);
      } catch (e) {
        this.logger.error("Failed to remove FCM token from DB after FCM send error: ", e, 'FcmService');
      }
    }
  }
}