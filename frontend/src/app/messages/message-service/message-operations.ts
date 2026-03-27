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

type MessageOperationsStateAdapter = {
  getCurrentConvId: () => number;
  isDisplayingNewest: () => boolean;
  getDisplayedMessages: () => MessageView[];
  updateDisplayedMessages: (updater: (msgs: MessageView[]) => MessageView[]) => void;
  getHighestDisplayedId: () => number;
  getLowestDisplayedId: () => number;
  notifyNewMessageAppeared: () => void;
  notifyOwnMessageSent: (success: boolean) => void;
};

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

  private state?: MessageOperationsStateAdapter;

  constructor() {
    this.websocket.messages$.subscribe({
      next: (msg: Message) => this.receiveMessage(msg),
    });
    this.websocket.messageUpdates$.subscribe({
      next: (msg: Message) => this.receiveMessageUpdate(msg),
    });
  }

  connect(state: MessageOperationsStateAdapter) {
    this.state = state;
  }

  disconnect() {
    this.state = undefined;
  }

  sendMessage(text: string, repliedId?: number) {
    if (!this.state) return;

    const timestamp = new Date();
    this.api.sendMessage(this.state.getCurrentConvId(), text, timestamp, repliedId).subscribe({
      next: (res: any) => {
        if (res.id === undefined) return;
        this.state?.notifyOwnMessageSent(true);
      },
      error: (e) => {
        this.state?.notifyOwnMessageSent(false);
        this.alertService.displayError(
          e.error.message ?? e.status ?? 'unknown',
          undefined,
          this.translate.instant('error.failed-to-send-msg')
        );
      }
    });
  }

  receiveMessage(message: Message) {
    if (!this.state) return;
    if (message.conversationId !== this.state.getCurrentConvId()) return;
    if (!this.state.isDisplayingNewest()) return;

    this.state.updateDisplayedMessages((msgs) => {
      const latestMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      return [...msgs, messageToMessageView(message, this.authService.getUserIdOrError(), latestMsg)];
    });

    this.state.notifyNewMessageAppeared();

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
    if (!this.state) return;

    this.api.deleteMessage(messageId, this.state.getCurrentConvId()).subscribe({
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
    if (!this.state) return;

    this.api.deleteMultipleMessages(messageIds, this.state.getCurrentConvId()).subscribe({
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
    if (!this.state) return;

    const toUpdate = this.state.getDisplayedMessages().find(m => m.globalId === message.globalId);
    if (!toUpdate) return;

    this.state.updateDisplayedMessages((msgs) => {
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
    if (!this.state) return;

    const toDelete = this.state.getDisplayedMessages().find(m => m.globalId === messageId);
    if (!toDelete || !toDelete.isOwn) return;

    const updatedMsg: MessageView = {
      ...toDelete,
      text: undefined,
      repliedId: undefined,
    };

    this.state.updateDisplayedMessages((msgs) => {
      return msgs.map(m => m.globalId === messageId ? updatedMsg : m);
    });

    this.conversationService.updateModifiedMessagePreview(updatedMsg);
  }
}
