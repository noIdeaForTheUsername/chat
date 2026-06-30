import { StringTemplate } from "src/application/shared/strings/string-params";


export class PushNotifcationEvent {
  userId: number;
  header: string | StringTemplate;
  message: string | StringTemplate;
  tag?: string;
}