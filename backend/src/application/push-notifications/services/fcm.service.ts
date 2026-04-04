import { Injectable } from "@nestjs/common";
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { SessionsService } from "src/domain/session/sessions.service";


@Injectable()
export class FcmService {

  constructor(
    private sessionsService: SessionsService,
  ) {}

  initFcm() {
    const serviceAccountPath = path.join(
      process.cwd(),
      'firebase-private.json',
    );

    if (!fs.existsSync(serviceAccountPath)) {
      console.error('FCM service account JSON NOT FOUND! Get it from Google Firebase Console for push notifications to work.');
      console.error('Expected path:', serviceAccountPath);
      process.exit(1);
    }

    try {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin');
      console.error(error);
      process.exit(1);
    }
  }

  async sendNotification(session: SessionEntity, title: string, message: string,
    normalizedLang: string, ttl: number, tag?: string) {
    if (!session.fcmToken) {
      console.warn(`No FCM token for session ${session.sid}, skipping FCM notification. This message shouldn't have appeared.`);
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
        console.error("Failed to remove FCM token from DB after FCM send error: ", e);
      }
    }
  }
}