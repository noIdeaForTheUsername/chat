import { effect, inject, Injectable, signal } from '@angular/core';
import { Conversation } from './conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { Message } from '@app/messages/message.interface';
import { BackendConversationApi } from './backend-conversation-api';
import { Profile } from '@app/profiles/profile.interface';
import { AuthService } from '@app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService implements LoadingStatus {
  private authService = inject(AuthService);

  public readonly conversations = signal<Conversation[]>([]);
  public readonly dataLoaded = signal(false);
  public readonly loadErrorCode = signal<number | null>(null);

  // not included in dataLoaded boolean, because it's non-critical
  public readonly conversationsLastMessages = signal(new Map<number, Message | null>());  // convIDs as keys; used for message previews, unread count etc
    
  private api = new BackendConversationApi(this.authService.getUserIdOrError());

  constructor(private profileService: ProfileService) {
    this.loadData();
    effect(() => {
      let conv = this.conversations();
      this.sortConversations();
    });
  }

  loadData() {
    // Load conversations
    this.api.getUserConversations().subscribe({
      next: (val) => {
        this.conversations.set(val);
        this.dataLoaded.set(true); 
      },
      error: (e) => {
        this.loadErrorCode.set(e.status);
      }
    });
    
    // Load message previews
    this.api.getMessagePreviews().subscribe({
      next: (previewsMap) => {
        this.conversationsLastMessages.set(previewsMap);
      },
      // non-critical data, no error handling
    });
  }

  sortConversations() {
    this.conversations.set(
      this.conversations().sort((conv, conv2) => {
        let msg = this.conversationsLastMessages().get(conv.id);
        let msg2 = this.conversationsLastMessages().get(conv2.id);
        let noMsg1 = (msg === undefined || msg === null);
        let noMsg2 = (msg2 === undefined || msg2 === null);
        if (noMsg1 && noMsg2) return 0;
        if (noMsg1) return 1;
        if (noMsg2) return -1;
        return msg2!.timestamp.getTime() - msg!.timestamp.getTime();
      })
    );
  }

  getConversationById(id: number): Conversation {
    let found = this.conversations().find((c) => c.id === id);
    if (found === undefined) throw new Error("getConversationById: ID not found");
    return found;
  }

  getConversationIfExists(id: number): Conversation | undefined {
    return this.conversations().find((c) => c.id === id);
  }

  getConversationByParticipantId(id: number, participantType: "user" | "group" = "user"): Conversation {
    let found = this.conversations().find((c) => c.participantId === id && this.profileService.getProfiles().get(id)?.type == "user");
    if (found === undefined) throw new Error("getConversationByUserId: ID not found");
    return found;
  }

  getConversations(): readonly Conversation[] {
    if (!this.dataLoaded()) throw new Error("Conversations not yet loaded - service users should check that first!");
    return this.conversations();
  }
}
