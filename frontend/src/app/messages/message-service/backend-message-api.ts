import { inject } from "@angular/core";
import { MockServer } from "@app/mock-server/mock.server"

export class BackendMessageApi {
  private readonly mockServer: MockServer = inject(MockServer);

  constructor() {

  }

  getUserMessages() {
    return this.mockServer.apiGetUserMessages();
  }

  getConversationMessages(convId: number, startMessageId: number, messagesNumber: number = 25, older = true, includeGivenId = false) {
    return this.mockServer.apiGetConversationMessages(convId, startMessageId, messagesNumber, older, includeGivenId);
  }
}
