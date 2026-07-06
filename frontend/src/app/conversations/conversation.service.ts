import { effect, inject, Injectable, signal } from '@angular/core';
import { Conversation } from './conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Message } from '@app/messages/message.interface';
import { BackendConversationApi } from './backend-conversation-api';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, finalize, Observable, of, Subject, tap, throwError } from 'rxjs';
import { WebsocketService } from '../websockets/websocket-service';
import { RefreshService } from '../loading/refresh.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private websocket = inject(WebsocketService);

  public readonly conversations = signal<Conversation[]>([]);
  public readonly conversationsLoaded = signal(false);
  public readonly loadErr = signal<number | null>(null);

  // not included in dataLoaded boolean, because it's non-critical
  public readonly conversationsMessagePreviews = signal(new Map<number, Message | null>());  // convIDs as keys; used for message previews, unread count etc
    
  private api = new BackendConversationApi(this.authService.getUserId());

  public newConversation$ = new Subject<void>();

  constructor() {
    this.loadConversations().subscribe();
    this.loadMessagePreviews().subscribe();

    this.websocket.messages$.subscribe((message) => {
      this.processNewMessage(message, false);
    });
    this.websocket.messageUpdates$.subscribe((modifiedMessage) => {
      this.updateModifiedMessagePreview(modifiedMessage);
    });
      
    this.websocket.reloadConversation$.subscribe({
      next: (convId: number) => {
        this.loadMessagePreviews().subscribe();
      }
    });
  }

  // -------------------------------------------------- INTERNAL LOGIC ---------------------------------------------

  loadConversations() {
    // Load conversations
    return this.api.getUserConversations().pipe(
      tap((val) => {
        this.conversations.set(val);
        this.conversationsLoaded.set(true);
        this.loadErr.set(null);
      }),
      catchError((e) => {
        this.conversationsLoaded.set(true);
        this.loadErr.set(e.status);
        return throwError(() => e);
      })
    );
  }

  private displayExistingDirectConversationError(conversationId: number) {
    this.alertService.displayPromptAlert(AlertType.PROMPT,
      this.translate.instant("prompt.conversation-exists"),
      () => this.router.navigate(['/chats', conversationId]),
      undefined,
      this.translate.instant("common.error")
    )
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


  // -------------------------------------------------- PUBLIC API ---------------------------------------------

  // LOADING

  // this should be called only for full refresh, as normally previews should be updated via websockets and processNewMessage()
  loadMessagePreviews() {  
    return this.api.getMessagePreviews().pipe(
      tap((previewsMap) => {
        this.conversationsMessagePreviews.set(previewsMap);
      })
    );
  }

  reconnectWebsocket() {
    this.websocket.reconnect();
  }

  // GETTERS

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
  getConversationByParticipantId(id: number): Conversation | undefined {
    let found = this.conversations().find((c) => c.participantId === id);
    return found;
  }

  // ACTIONS

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
        this.alertService.displayError(e.status);
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

  // MESSAGE PREVIEWS / ACK PROCESSING

  processNewMessage(message: Message, immediateAcknowledge: boolean) {  // immediate acknowledge happens when the conversation is already open
    // find conv
    const conv = this.conversations().find(c => c.id === message.conversationId);
    if (!conv) {  
      // new conversation received
      this.loadConversations().subscribe({
        next: () => {
          this.newConversation$.next();
        }
      });
      return;
    };
    // update message preview
    this.conversationsMessagePreviews.update((prev) => {
      const newMap = new Map(prev);
      newMap.set(message.conversationId, message);
      return newMap;
    });
    // acknowledge not own message (backend auto-acknowledges own messages)
    if (immediateAcknowledge && message.senderId !== this.authService.getUserId()) {
      this.acknowledgeConversationMessages(message.conversationId, message.globalId);
    }
  }

  acknowledgeConversationMessages(conversationId: number, newestMessageId?: number) {
    let conv = this.conversations().find(c => c.id === conversationId);  // find conv
    if (!conv) return;

    const newestId = newestMessageId  // find newest read ID
      ?? this.conversationsMessagePreviews().get(conversationId)?.globalId;
    if (newestId === undefined) return;

    this.websocket.acknowledgeConversationMessages(conversationId); // update
    conv.newestReadMessageId = newestId;
    this.updateLocalConversation(conv);
  }

  public updateModifiedMessagePreview(modifiedMessage: Message) {
    const currentPreviewGid = this.conversationsMessagePreviews().get(modifiedMessage.conversationId)?.globalId;
    if (currentPreviewGid && modifiedMessage.globalId == currentPreviewGid) {
      this.processNewMessage(modifiedMessage, false);
    }
  }
}
