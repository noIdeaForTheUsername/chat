import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

@Entity('sessions')
export class SessionEntity {

  // BASIC

  @PrimaryColumn({ type: 'text' })
  sid: string;

  @Column({ type: 'int', nullable: false, name: 'user_id' })
  userId: number;

  @Column({ type: 'timestamptz', nullable: false, name: 'expires' })
  expires: Date;

  @Column({ type: 'jsonb', nullable: false, name: 'cookie' })
  cookie: Record<string, any>;


  // APPLICATION DATA

  @Column({ type: 'jsonb', nullable: true, name: 'push_subscription' })
  pushSubscription: Record<string, any> | null;

  @Column({ type: 'text', nullable: true, name: 'push_fcm_token' })
  fcmToken: string | null;

  @Column({ type: 'character', length: 2, nullable: true, name: "language"})
  language: string | null;
}