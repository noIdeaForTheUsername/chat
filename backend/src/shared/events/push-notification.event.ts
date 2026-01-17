
export class PushNotifcationEvent {
  userId: number;
  header: string;
  message: string
  tag?: string;
  clickUrl?: string;
}