import { effect, inject, Injectable, signal } from '@angular/core';
import { Conversation } from './conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Message } from '@app/messages/message.interface';
import { BackendConversationApi } from './backend-conversation-api';
import { Profile } from '@app/profiles/profile.interface';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  public readonly conversations = signal<Conversation[]>([]);
  public readonly conversationsLoaded = signal(false);
  // public readonly loadErrorCode = signal<number | null>(null);

  // not included in dataLoaded boolean, because it's non-critical
  public readonly conversationsMessagePreviews = signal(new Map<number, Message | null>());  // convIDs as keys; used for message previews, unread count etc
    
  private api = new BackendConversationApi(this.authService.getUserIdOrError());

  constructor(private profileService: ProfileService) {
    this.loadData();
    effect(() => {
      // const _ = this.conversations();
      // const __ = this.conversationsMessagePreviews();
      // this.sortConversations();
    });
  }

  // -------------------------------------------------- INTERNAL LOGIC ---------------------------------------------

  loadData() {
    // Load conversations
    this.api.getUserConversations().subscribe({
      next: (val) => {
        console.log(val);
        this.conversations.set(val);
        this.conversationsLoaded.set(true);
      },
      error: (e) => this.conversationsLoaded.set(true)
    });

    this.loadMessagePreviews();
  }

  private displayExistingDirectConversationError(conversationId: number) {
    this.alertService.displayPromptAlert(AlertType.PROMPT,
      this.translate.instant("prompt.conversation-exists"),
      () => this.router.navigate(['/chats', conversationId]),
      undefined,
      this.translate.instant("common.error")
    )
  }

  // -------------------------------------------------- PUBLIC API ---------------------------------------------

  loadMessagePreviews() {
    this.api.getMessagePreviews().subscribe({
      next: (previewsMap) => {
        this.conversationsMessagePreviews.set(previewsMap);
      },
      error: (e) => this.conversationsLoaded.set(true)
    });
  }

  getConversationById(id: number): Observable<Conversation> {
    let found = this.conversations().find((c) => c.id === id);
    if (found !== undefined) return of(found);

    // If not found, loading from backend:
    return this.api.getConversationById(id).pipe(
      tap((conv) => {
        const existing = this.conversations().find(c => c.id === conv.id);
        if (existing) return; // already in list; this may actually happen if that conv loads already!
        this.conversations.set([conv, ...this.conversations()]);
      })
    );
  }

  // Unlike getConversationById, this only checks existing conversations in memory
  getConversationByParticipantId(id: number, participantType: "user" | "group" = "user"): Conversation | undefined {
    let found = this.conversations().find((c) => c.participantId === id && this.profileService.profiles().get(id)?.type == "user");
    return found;
  }

  ackowledgeConversationMessages(conversationId: number) {
    // call API
    this.api.ackowledgeMessages(conversationId).pipe(
      // mark locally as ackowledged regardless of API call result
      finalize(() => {
        let conv = this.conversations().find(c => c.id === conversationId);
        if (!conv) return;
        conv.newestReadMessageId = this.conversationsMessagePreviews().get(conversationId)?.globalId;
        this.updateLocalConversation(conv);
      })
    ).subscribe();
  }


  createDirectConversation(participantId: number, redirectAfterCreation = false) {
    const sameConversation = this.conversations().find(c => c.participantId === participantId);
    if (sameConversation) {
      this.displayExistingDirectConversationError(sameConversation.id);
      return;
    }

    return this.api.createDirectConversation(participantId).subscribe({
      next: (conv) => {
        if (redirectAfterCreation) {
          this.router.navigate(['/chats', conv.id]);
        }
      },
      error: (e) => {
        this.alertService.displayErrorById(e.status);
      },
    });
  }

  clearConversationMessages(conversationId: number) {
    this.api.clearConversationMessages(conversationId).subscribe({
      next: (res) => {
        this.alertService.displayMessageAlert(
          AlertType.INFO, this.translate.instant("prompt.conversation-cleared"));
      },
      error: (e) => this.alertService.displayMessageAlert(
        AlertType.ERROR, this.translate.instant("error.failed-to-delete"))
    });
  }

  clearMultipleConversationMessages(conversationIds: number[]) {  // recursive
    const convId = conversationIds.shift();
    if (convId === undefined) return;  // all done
    this.clearConversationMessages(convId);
    setTimeout(() => this.clearMultipleConversationMessages(conversationIds), 150);
  }

  private updateLocalConversation(conversation: Conversation) {
    const index = this.conversations().findIndex(c => c.id === conversation.id);
    let updatedConversations = [...this.conversations()];
    if (index === -1)
      updatedConversations.unshift(conversation);
    else
      updatedConversations[index] = conversation;
    this.conversations.set(updatedConversations);
  }
}
