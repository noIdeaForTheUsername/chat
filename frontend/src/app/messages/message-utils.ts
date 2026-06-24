import { MessageView } from "./message-view.interface";
import { Message } from "./message.interface";

export type ServerMessage = Omit<Message, "timestamp"> & { timestamp: string };

export function serverMessageToMessage(serverMessage: ServerMessage): Message {
  return {
    ...serverMessage,
    timestamp: new Date(serverMessage.timestamp),
  };
}

export function messageToMessageView(msg: Message, currentUserId: number, prevMessage?: MessageView): MessageView {
  return {
    ...msg,
    prevMessage,
    isOwn: msg.senderId === currentUserId,
  };
}