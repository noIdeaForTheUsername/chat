import { Message } from "@app/messages/message.interface";


export interface MessageView extends Message {
  isOwn: boolean;
  repliedText?: string;
}