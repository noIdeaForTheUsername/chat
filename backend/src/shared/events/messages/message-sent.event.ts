import { Message } from "src/domain/messages/entities/message.entity";

export class MessageSentEvent {
  constructor(
    public readonly senderId: number,
    public readonly receiverIds: number[],
    public readonly message: Message
  ) {}
}