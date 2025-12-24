import { ServerConversation } from "../mock-server/server-conversation.interface";

export let testConversations: ServerConversation[] = [
  {
    id: 1,
    participant1Id: 20,
    participant2Id: 2,
    newestMessageReadId: 622
  },
  {
    id: 2,
    participant1Id: 4,
    participant2Id: 20,
    newestMessageReadId: 190
  },
  {
    id: 3,
    participant1Id: 4,
    participant2Id: 5,
  },
  {
    id: 4,
    participant1Id: 1,
    participant2Id: 4,
  },
  {
    id: 5,
    participant1Id: 20,
    participant2Id: 3,
  },
];