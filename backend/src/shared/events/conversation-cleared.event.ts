
export class ConversationClearedEvent {
  constructor(
    public userIds: number[],
    public conversationId: number
  ) {}
}