import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

@Entity('device_sessions')
export class DeviceSessionEntity {
  @PrimaryColumn({ type: 'text' })
  sid: string;

  @Column({ type: 'int', nullable: true, name: 'user_id' })
  userId: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'push_subscription' })
  pushSubscription: Record<string, any> | null;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'timestamptz', name: 'expire' })
  expiresAt: Date;
}