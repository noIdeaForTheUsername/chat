export interface ServerConversation {
  id: number,
  participant1Id: number,
  participant2Id: number,
  // TODO: (maybe) MOVE THE VARIABLES BELOW TO SOMETHING LIKE ConversationUserSettings (server-only - client should have that all-in-one)
  newestMessageReadId?: number,
  version?: number
}