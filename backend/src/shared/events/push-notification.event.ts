

export class PushNotifcationEvent {
  userId: number;
  header: string | string[];
  message: string | string[]; 
  tag?: string;
  // clickUrl?: string;
}