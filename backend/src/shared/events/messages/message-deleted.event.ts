import { Message } from "src/domain/messages/entities/message.entity";

export class MessageDeletedEvent {
  constructor(
    public receiverIds: number[],
    public message: Message
  ) {}
}