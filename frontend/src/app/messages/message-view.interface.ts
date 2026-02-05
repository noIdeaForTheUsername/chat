import { Message } from "@app/messages/message.interface";


export interface MessageView extends Message {
  prevMessage: MessageView | undefined;
  isOwn: boolean;
  repliedText?: string;
}