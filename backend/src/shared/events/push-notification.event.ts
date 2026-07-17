import { StringTemplate } from "src/application/shared/strings/string-template";


export class PushNotifcationEvent {
  userId: number;
  header: string | StringTemplate;
  message: string | StringTemplate;
  tag?: string;
}