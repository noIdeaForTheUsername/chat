import { effect, inject, Injectable, signal } from '@angular/core';
import { Conversation } from './conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { Message } from '@app/messages/message.interface';
import { BackendConversationApi } from './backend-conversation-api';
import { Profile } from '@app/profiles/profile.interface';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ConversationService implements LoadingStatus {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private translate = inject(TranslateService);

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
    console.log("load data called");
    this.api.getUserConversations().subscribe({
      next: (val) => {
        console.log("conversation srv load data success");
        console.log("result:", val);
        this.conversations.set(val);
        this.dataLoaded.set(true); 
        console.log("signal in srv changed");
      },
      error: (e) => {
        this.loadErrorCode.set(e.status);
        console.log("conversation srv load data error");
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

  protected sortConversations() {
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

  createDirectConversation(participantId: number) {
    const sameConversation = this.conversations().find(c => c.participantId === participantId);
    if (sameConversation) {
      this.displayExistingDirectConversationError(sameConversation.id);
      return;
    }

    return this.api.createDirectConversation(participantId).subscribe({
      next: (val) => {
        this.loadData();  // reload conversations
        this.profileService.loadData();
      },
      error: (e) => {
        this.alertService.displayErrorById("unknown");
      }
    });
  }
  
  private displayExistingDirectConversationError(conversationId: number) {
    this.alertService.displayPromptAlert(AlertType.PROMPT,
      this.translate.instant("prompt.conversation-exists"),
      () => this.router.navigate(['/chats', conversationId]),
      undefined,
      this.translate.instant("common.error")
    )
  }
}
