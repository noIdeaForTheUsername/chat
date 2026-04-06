import { inject, Injectable } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { MessageView } from '../message-view.interface';
import { messageToMessageView } from '../message-utils';
import { AlertType } from '@app/alerts/alert-type.enum';
import { BackendMessageApi } from './backend-message-api';
import { ReplyPreviewManager } from './reply-previews';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from '@src/app/conversations/conversation.service';
import { WebsocketService } from '@src/app/websockets/websocket-service';
import { MessageStateStore } from './message-state.store';

@Injectable({
  providedIn: 'root',
})
export class MessageOperations {

  private readonly api = inject(BackendMessageApi);
  private readonly replyPreviewManager = inject(ReplyPreviewManager);
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  private readonly translate = inject(TranslateService);
  private readonly conversationService = inject(ConversationService);
  private readonly websocket = inject(WebsocketService);
  private readonly state = inject(MessageStateStore);

  constructor() {
    this.websocket.messages$.subscribe({
      next: (msg: Message) => this.receiveMessage(msg),
    });
    this.websocket.messageUpdates$.subscribe({
      next: (msg: Message) => this.receiveMessageUpdate(msg),
    });
  }

  sendMessage(text: string, repliedId?: number) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1) return;

    this.api.sendMessage(currentConvId, text, repliedId).subscribe({
      next: (res: any) => {
        if (res.id === undefined) return;
        if (this.websocket.getConnected()) {
          this.state.ownMessageSent.next(true);
        }
        else {
          // websocket won't "reflect" the sent message, but HTTP returned success so it was
          // successfully sent, so add it locally as a hopefully rare fallback
          this.receiveMessage({
            globalId: res.id,
            conversationId: this.state.getCurrentConvId(),
            senderId: this.authService.getUserIdOrError(),
            text: text,
            repliedId,
            timestamp: new Date(),
          });
          this.state.ownMessageSent.next(true);
        }
      },
      error: (e) => {
        this.state.ownMessageSent.next(false);
        if (e.status === 429) {
          this.alertService.displayError("too-many-messages");
        }
        else {
          this.alertService.displayError(
            e.error.message ?? e.status ?? 'unknown',
            undefined,
            this.translate.instant('error.failed-to-send-msg')
          );
        }
      }
    });
  }

  receiveMessage(message: Message) {
    if (message.conversationId !== this.state.getCurrentConvId()) return;
    if (!this.state.displayingNewestMessages()) return;

    this.state.displayedMessages.update((msgs) => {
      const latestMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      return [...msgs, messageToMessageView(message, this.authService.getUserIdOrError(), latestMsg)];
    });

    this.state.newMessageAppeared.next();

    if (message.senderId !== this.authService.getUserId()) {
      this.conversationService.acknowledgeConversationMessages(this.state.getCurrentConvId(), message.globalId);
    }

    this.replyPreviewManager.loadSingleMessagePreview(
      message,
      this.state.getHighestDisplayedId(),
      this.state.getLowestDisplayedId()
    );
  }

  deleteMessage(messageId: number) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1) return;

    this.api.deleteMessage(messageId, currentConvId).subscribe({
      next: () => this.deleteOwnMessageLocally(messageId),
      error: (e) => {
        if (e.error.message === 'cannot-delete-not-own-message') return;
        this.alertService.displayMessageAlert(
          AlertType.ERROR,
          this.translate.instant('error.failed-to-delete')
        );
      }
    });
  }

  deleteMultipleMessages(messageIds: number[]) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1) return;

    this.api.deleteMultipleMessages(messageIds, currentConvId).subscribe({
      next: () => {
        for (const msgId of messageIds) {
          this.deleteOwnMessageLocally(msgId);
        }
      },
      error: () => this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('error.failed-to-delete')
      ),
    });
  }

  receiveMessageUpdate(message: Message) {
    const toUpdate = this.state.displayedMessages().find(m => m.globalId === message.globalId);
    if (!toUpdate) return;

    this.state.displayedMessages.update((msgs) => {
      return msgs.map(m =>
        m.globalId === message.globalId
          ? messageToMessageView(message, this.authService.getUserIdOrError())
          : m
      );
    });

    if (message.repliedId) {
      this.replyPreviewManager.loadSingleMessagePreview(
        message,
        this.state.getHighestDisplayedId(),
        this.state.getLowestDisplayedId()
      );
    }
  }

  private deleteOwnMessageLocally(messageId: number) {
    const toDelete = this.state.displayedMessages().find(m => m.globalId === messageId);
    if (!toDelete || !toDelete.isOwn) return;

    const updatedMsg: MessageView = {
      ...toDelete,
      text: undefined,
      repliedId: undefined,
    };

    this.state.displayedMessages.update((msgs) => {
      return msgs.map(m => m.globalId === messageId ? updatedMsg : m);
    });

    this.conversationService.updateModifiedMessagePreview(updatedMsg);
  }
}
