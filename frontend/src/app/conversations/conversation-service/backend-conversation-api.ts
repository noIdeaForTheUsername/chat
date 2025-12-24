import { inject } from "@angular/core";
import { MockServer } from "@app/mock-server/mock.server";

export class BackendConversationApi {
  private readonly mockServer: MockServer;

  constructor() {
    this.mockServer = inject(MockServer);
  }

  getUserConversations() {
    return this.mockServer.apiGetUserConversations();
  }

  getUserConversationsLastMessages() {
    return this.mockServer.apiGetUserConversationsLastMessages();
  }
}
