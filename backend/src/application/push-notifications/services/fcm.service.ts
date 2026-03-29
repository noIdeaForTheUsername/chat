import { Injectable } from "@nestjs/common";
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { getNormalizedLang, getNotificationTitleString, getTranslatedString } from "../strings/notification-strings-utils";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


@Injectable()
export class FcmService {

  constructor(
    @InjectRepository(SessionEntity)
    private sessionsRepository: Repository<SessionEntity>
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

  async sendNotification(session: SessionEntity, title: string | string[], message: string | string[],
    ttl: number, tag?: string, language?: string) {
    if (!session.fcmToken) {
      console.warn(`No FCM token for session ${session.sid}, skipping FCM notification. This message shouldn't have appeared.`);
      return;
    }

    const normalizedLang = getNormalizedLang(language);
    const titleStr = getNotificationTitleString(title, normalizedLang);
    const messageStr = getTranslatedString(normalizedLang, message);
    const notification = {
      title: titleStr,
      body: messageStr,
      tag: tag,
    };

    const payload: admin.messaging.Message = {
      data: {
        notification: JSON.stringify(notification),
        title: titleStr,
        body: messageStr,
        tag: tag ?? "",
        lang: normalizedLang,
      },

      android: {
        ttl: ttl * 1000,
        priority: "high",
        collapseKey: tag,
        notification: {
          title: titleStr,
          body: messageStr,
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
      await this.sessionsRepository.update(session.sid, {
        fcmToken: null
      });
    }
  }
}