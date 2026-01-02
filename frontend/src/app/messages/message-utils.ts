import { MessageView } from "./chat-page/message-card-component/message-view.interface";
import { Message } from "./message.interface";

export type ServerMessage = Omit<Message, "timestamp"> & { timestamp: string };

export function serverMessageToMessage(serverMessage: ServerMessage): Message {
  return {
    ...serverMessage,
    timestamp: new Date(serverMessage.timestamp),
  };
}

// TODO: do something about the "repliedId" field later
export function messageToMessageView(msg: Message, currentUserId: number): MessageView {
  console.log("message converstion: ", msg);
  console.log("given user ID: ", currentUserId);
  console.log("is own result: ", msg.senderId === currentUserId);
  return {
    ...msg,
    isOwn: msg.senderId === currentUserId,
  };
}