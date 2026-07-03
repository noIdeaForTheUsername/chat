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
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { MessageFileLoader } from './message-file-loader';
import { BaseFileInfo, FileInfo } from '@src/app/files/file-types';
import { FileDownloaderService } from '@src/app/files/services/file-downloader';
import { FileCompressorService } from '@src/app/files/services/file-compressor';

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
  private readonly fileLoader = inject(MessageFileLoader);
  private readonly fileCompressor = inject(FileCompressorService);

  private readonly MESSAGE_LENGTH_LIMIT = 4000;  // enforced on backend too

  constructor() {
    this.websocket.messages$.subscribe({
      next: (msg: Message) => this.receiveMessage(msg),
    });
    this.websocket.files$.subscribe({
      next: (unmappedFileInfos) => {
        this.receiveFiles(unmappedFileInfos);
      }
    });
    this.websocket.messageUpdates$.subscribe({
      next: (msg: Message) => this.receiveMessageUpdate(msg),
    });
  }

  sendMessage(text: string, repliedId?: number) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1)
      return;

    if (!this.validateMessageLength(text))
      return;

    this.api.sendMessage(currentConvId, text, repliedId).subscribe({
      next: (res: any) => {
        this.handleMessageSendingResponse(res, text, repliedId);
      },
      error: (e) => {
        this.handleMessageSendingError(e);
      }
    });
  }

  async sendMessageWithFiles(files: File[], text?: string, repliedId?: number) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1)
      return;
    if (!this.validateMessageLength(text ?? ""))
      return;

    let compressedFiles = await this.fileCompressor.compressFilesIfPossible(files);
    
    this.state.uploadSubscription = this.api.uploadFiles(currentConvId, compressedFiles, text, repliedId).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Track upload progress (0-100)
          if (event.total) {
            // capped at 95% until the final response
            const percentage = Math.round((event.loaded / event.total) * 95);
            this.state.uploadProgress.next(percentage); 
          }
        } else if (event instanceof HttpResponse) {
          this.state.uploadProgress.next(100);
          this.handleMessageSendingResponse(event.body, text ?? '', repliedId);
        }
      },
      error: (e) => {
        this.state.uploadProgress.next(0);
        this.handleMessageSendingError(e);
      }
    });
  }

  cancelFileUpload() {
    if (this.state.uploadSubscription) {
      this.state.uploadSubscription.unsubscribe();
    }
    this.state.uploadSubscription = null;
    this.state.uploadProgress.next(0);
  }

  private validateMessageLength(messageText: string) {
    if (messageText.length > this.MESSAGE_LENGTH_LIMIT) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('error.message-too-long.description', { excess: messageText.length - this.MESSAGE_LENGTH_LIMIT }),
        undefined,
        this.translate.instant('error.message-too-long.header')
      );
      this.state.ownMessageSent.next(false);
      return false;
    }
    return true;
  }

  private handleMessageSendingError(e: any) {
    this.state.ownMessageSent.next(false);
    if (e.status === 429) {
      this.alertService.displayError("too-many-messages");
    }
    else if (e.status === 400 && e.error?.message === 'message-too-long') {
      this.alertService.displayError("message-too-long");
    }
    else {
      this.alertService.displayError(
        e.status ?? 'unknown',
        undefined,
        this.translate.instant('error.failed-to-send-msg')
      );
    }
  }

  private handleMessageSendingResponse(successfulRes: any, messageText: string, messageRepliedId?: number) {
    if (!successfulRes || !successfulRes.id)
      throw new Error("Server did not return message ID after message sending");

    if (this.websocket.getConnected()) {
      this.state.ownMessageSent.next(true);
    }
    else {
      // websocket disconnected so it won't "reflect" the sent message, but HTTP returned success meaning
      // the message was successfully sent, so add it locally as a fallback
      this.receiveMessage({
        globalId: successfulRes.id,
        conversationId: this.state.getCurrentConvId(),
        senderId: this.authService.getUserIdOrError(),
        text: messageText,
        repliedId: messageRepliedId,
        timestamp: new Date(),
      });
      this.state.ownMessageSent.next(true);
    }
  }

  receiveMessage(message: Message) {
    if (message.conversationId !== this.state.getCurrentConvId())
      return;
    if (!this.state.displayingNewestMessages())
      return;

    this.addNewMessage(message);
    this.state.newMessageAppeared.next();

    if (message.senderId != this.authService.getUserId()) {
      this.conversationService.acknowledgeConversationMessages(this.state.getCurrentConvId(), message.globalId);
    }

    this.replyPreviewManager.loadSingleMessagePreview(
      message,
      this.state.getHighestDisplayedId(),
      this.state.getLowestDisplayedId()
    );
  }

  receiveFiles(filesInfo: (BaseFileInfo | FileInfo)[]) {
    this.fileLoader.handleIncomingFilesInfo(filesInfo);
  }

  private addNewMessage(newMessage: Message) {
    const messages = this.state.displayedMessages();
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
    let newMessageView = messageToMessageView(newMessage, this.authService.getUserIdOrError(), latestMessage);
    newMessageView = this.fileLoader.addPendingFilesToMessage(newMessageView);

    this.state.displayedMessages.update((msgs) => [...msgs, newMessageView]);
  }

  deleteMessage(messageId: number) {
    const currentConvId = this.state.getCurrentConvId();
    if (currentConvId === -1) return;

    this.api.deleteMessage(messageId, currentConvId).subscribe({
      next: () => this.deleteOwnMessageLocally(messageId),
      error: (e) => {
        if (e.error.message === 'cannot-delete-not-own-message')
          return;
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
    this.state.messagesDidRefresh.next();

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
    if (!toDelete || !toDelete.isOwn)
      throw new Error("Attempted to delete a message that is not owned by the user or not displayed");


    const updatedMsg: MessageView = {
      ...toDelete,
      text: undefined,
      repliedId: undefined,
      files: undefined,
    };

    this.state.displayedMessages.update((msgs) => {
      return msgs.map(m => m.globalId === messageId ? updatedMsg : m);
    });
    this.state.messagesDidRefresh.next();


    this.conversationService.updateModifiedMessagePreview(updatedMsg);
  }
}
