import { Message } from '@app/messages/message.interface';
import { MessageView } from '../chat-page/message-card-component/message-view.interface';
import { messageToMessageView } from '../message-utils';
import { AlertType } from '@app/alerts/alert-type.enum';
import { BackendMessageApi } from './backend-message-api';
import { MessageService } from './message.service';
import { ReplyPreviewManager } from './reply-previews';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from '@src/app/conversations/conversation.service';
import { WebsocketService } from '@src/app/websockets/websocket-service';

export class MessageOperations {

  constructor(
    private s: MessageService,
    private api: BackendMessageApi,
    private replyPreviewManager: ReplyPreviewManager,
    private authService: AuthService,
    private alertService: AlertService,
    private translate: TranslateService,
    private conversationService: ConversationService,
    private websocket: WebsocketService,
  ) {
    // Subscribe to incoming messages from the socket service
    this.websocket.messages$.subscribe({
      next: (msg: Message) => {
        this.receiveMessage(msg);
      }
    });
    this.websocket.messageUpdates$.subscribe({
      next: (msg: Message) => {
        this.receiveMessageUpdate(msg);
      }
    });
  }

  sendMessage(text: string, callBeforeComplete?: Function, repliedId?: number, repliedText?: string) {
    const timestamp = new Date();
    this.api.sendMessage(this.s.getCurrentConvId(), text, timestamp, repliedId).subscribe({
      next: (res: any) => {
        if (res.id === undefined) return;
        if (callBeforeComplete) callBeforeComplete();
        if (!this.s.displayingNewestMessages()) return;
        const newMsg = {
          globalId: res.id,
          numberInConversation: 0,  // todo in the future
          conversationId: this.s.getCurrentConvId(),
          senderId: this.authService.getUserIdOrError(),
          text: text,
          timestamp,
          isOwn: true,
          repliedId,
          repliedText
        }
        this.s.displayedMessages.update((msgs) => {
          return [...msgs, {
            ...newMsg,
            prevMessage: msgs.length > 0 ? msgs[msgs.length - 1] : undefined
          }];
        });
        this.conversationService.processNewMessage(newMsg, true);
      },
      error: (e) => {
        this.alertService.displayError(
          e.error.message ?? e.status ?? "unknown",
          undefined,
          this.translate.instant("error.failed-to-send-msg"));
      }
    });
  }

  receiveMessage(message: Message) {
    if (message.conversationId != this.s.getCurrentConvId()) return;
    
    this.s.beforeNewMessageCallback();
    if (!this.s.displayingNewestMessages()) return;
    
    this.s.displayedMessages.update((msgs) => {
      const latestMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      return [...msgs, messageToMessageView(message, this.authService.getUserIdOrError(), latestMsg)];
    });
    this.conversationService.acknowledgeConversationMessages(this.s.getCurrentConvId(), message.globalId);
    this.replyPreviewManager.loadSingleMessagePreview(message, this.s.getHighestDisplayedId(), this.s.getLowestDisplayedId());
  }

  deleteMessage(messageId: number) {
    this.api.deleteMessage(messageId, this.s.getCurrentConvId()).subscribe({
      next: (res) => {
        this.deleteOwnMessageLocally(messageId);
      },
      error: (e) => {
        if (e.error.message == "cannot-delete-not-own-message") return;  // silently ignore
        this.alertService.displayMessageAlert(
          AlertType.ERROR, this.translate.instant("error.failed-to-delete"));
      }
    });
  }

  deleteMultipleMessages(messageIds: number[]) {
    this.api.deleteMultipleMessages(messageIds, this.s.getCurrentConvId()).subscribe({
      next: (res) => {
        for (const msgId of messageIds)
          this.deleteOwnMessageLocally(msgId);
      },
      error: (e) => this.alertService.displayMessageAlert(
        AlertType.ERROR, this.translate.instant("error.failed-to-delete")),
    });
  }

  receiveMessageUpdate(message: Message) {
    // find and update the message in displayedMessages
    const toUpdate = this.s.displayedMessages().find(m => m.globalId === message.globalId);
    if (!toUpdate) return;  // message not displayed so don't proceed

    this.s.displayedMessages.update((msgs) => {
      return msgs.map(m => m.globalId === message.globalId ? messageToMessageView(message, this.authService.getUserIdOrError()) : m);
    });
    if (message.repliedId) {
      this.replyPreviewManager.loadSingleMessagePreview(message, this.s.getHighestDisplayedId(), this.s.getLowestDisplayedId());
    }
  }

  private deleteOwnMessageLocally(messageId: number) {
    const toDelete = this.s.displayedMessages().find(m => m.globalId === messageId);
    if (!toDelete || !toDelete.isOwn) return;  // message not displayed or not own - don't proceed

    const updatedMsg: MessageView = {
      ...toDelete,
      text: undefined,
      repliedId: undefined,
    };
    this.s.displayedMessages.update((msgs) => {
      return msgs.map(m => m.globalId === messageId ? updatedMsg : m);
    });
    this.conversationService.updateModifiedMessagePreview(updatedMsg);
  }
}
