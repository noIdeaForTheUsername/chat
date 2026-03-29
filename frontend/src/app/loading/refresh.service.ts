import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ConversationService } from '../conversations/conversation.service';
import { ProfileService } from '../profiles/profile-service/profile.service';
import { AlertService } from '../alerts/alert-service/alert.service';
import { ConversationView } from '../conversations/conversations-page/conversation-view.interface';
import { MessageService } from '../messages/message-service/message.service';
import { WebsocketService } from '../websockets/websocket-service';

@Injectable({
  providedIn: 'root',
})
export class RefreshService {

  private conversationService = inject(ConversationService);
  private profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  private websocket = inject(WebsocketService);
  private alertService = inject(AlertService);


  constructor() {
    this.websocket.reconnected$.subscribe(() => {
      this.refreshData(undefined, true);
      // Reload current messages if displayingNewestMessages (= if the page is not scrolled up)
      if (this.messageService.displayingNewestMessages())
        this.messageService.loadCurrentConversation();
    });
  }
  
  // Event is the ion-refresher component event
  async refreshData(event?: any, withConversations = true): Promise<void> {
    let timeout; 
    try {
      if (event) timeout = setTimeout(() => event.target.complete(), 7000);  // max waiting time
      await Promise.all([
        lastValueFrom(this.conversationService.loadMessagePreviews()),
        withConversations ? lastValueFrom(this.conversationService.loadConversations()) : Promise.resolve(),
        lastValueFrom(this.profileService.loadData()),
      ]);
      this.conversationService.reconnectWebsocket();
    }
    catch (e: any) {
      this.alertService.displayError(e.status ?? "data-unavailable");
    }
    finally {
      if (event) {
        event.target.complete();
        clearTimeout(timeout);
      }
    }
  }

  checkDataMissing(conversations: ConversationView[]): boolean {
    for (let conv of conversations) {
      if (!this.profileService.profiles().has(conv.participantId)) return true;
      // if (!this.lastMessages().has(conv.id)) return true;   ->  Conversation might be empty (no messages)
    }
    return false;
  }
}
