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
import { Observable, of, tap } from 'rxjs';

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
      const _ = this.conversations();
      const __ = this.conversationsMessagePreviews();
      this.sortConversations();
    });
  }

  loadData() {
    // Load conversations
    this.api.getUserConversations().subscribe({
      next: (val) => {
        this.conversations.set(val);
        this.conversationsLoaded.set(true);
      },
      error: (e) => this.conversationsLoaded.set(true)
    });

    this.loadMessagePreviews();
  }

  loadMessagePreviews() {
    this.api.getMessagePreviews().subscribe({
      next: (previewsMap) => {
        this.conversationsMessagePreviews.set(previewsMap);
      },
      error: (e) => this.conversationsLoaded.set(true)
    });
  }

  protected sortConversations() {
    this.conversations.set(
      this.conversations().sort((conv, conv2) => {
        let msg = this.conversationsMessagePreviews().get(conv.id);
        let msg2 = this.conversationsMessagePreviews().get(conv2.id);
        let noMsg1 = (msg === undefined || msg === null);
        let noMsg2 = (msg2 === undefined || msg2 === null);
        if (noMsg1 && noMsg2) return 0;
        if (noMsg1) return 1;
        if (noMsg2) return -1;
        return msg2!.timestamp.getTime() - msg!.timestamp.getTime();
      })
    );
  }

  getConversationById(id: number): Observable<Conversation> {
    let found = this.conversations().find((c) => c.id === id);
    if (found !== undefined) return of(found);

    // If not found, loading from backend:
    return this.api.getConversationById(id).pipe(
      tap((conv) => {
        this.conversations.set([conv, ...this.conversations()]);
      })
    );
  }

  // Unlike getConversationById, this only checks existing conversations in memory
  getConversationByParticipantId(id: number, participantType: "user" | "group" = "user"): Conversation | undefined {
    let found = this.conversations().find((c) => c.participantId === id && this.profileService.profiles().get(id)?.type == "user");
    return found;
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
  
  private displayExistingDirectConversationError(conversationId: number) {
    this.alertService.displayPromptAlert(AlertType.PROMPT,
      this.translate.instant("prompt.conversation-exists"),
      () => this.router.navigate(['/chats', conversationId]),
      undefined,
      this.translate.instant("common.error")
    )
  }
}
