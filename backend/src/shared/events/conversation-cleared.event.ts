
export class ConversationClearedEvent {
  constructor(
    public callerId: number,  // the user who cleared the conversation (only their own messages are deleted)
    public conversationParticipants: number[],  // excluding caller and caller-blocking users
    public conversationId: number
  ) {}
}