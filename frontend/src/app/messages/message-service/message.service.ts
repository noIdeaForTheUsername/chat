import { inject, Injectable } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { BackendMessageApi } from './backend-message-api';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { ReplyPreviewManager } from './reply-previews';
import { MessageOperations } from './message-operations';
import { WebsocketService } from '../../websockets/websocket-service';
import { ConversationService } from '@src/app/conversations/conversation.service';
import { MessageStateStore } from './message-state.store';
import {
  getMetadataUpdateFlags,
  mapMessagesToView,
  mergeLoadedMessages,
  trimOverflowMessages,
} from './message-loading-helpers';
import { MessageFileLoader } from './message-file-loader';
import { MessageView } from '../message-view.interface';

// DESCRIPTION: This service doesn't return data. It loads it and manages it internally, providing signals for components to bind to.
// The chatPage manages the UI only, while being directly connected to this service's variables/signals.

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  // DEPENDENCIES
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);
  private readonly websocket = inject(WebsocketService);
  private readonly conversationService = inject(ConversationService);
  private readonly api = inject(BackendMessageApi);
  private readonly replyPreviewManager = inject(ReplyPreviewManager);
  private readonly fileLoader = inject(MessageFileLoader);
  private readonly state = inject(MessageStateStore);
  public readonly operations = inject(MessageOperations);

  // SETTINGS
  private readonly MAX_MESSAGES_DISPLAYED = 200;
  private readonly LOADED_MESSAGES_AMOUNT = 25; // loaded messages per one top-scroll
  private readonly INCREASED_LOADED_MESSAGES_AMOUNT = 75; // per one top-scroll, if the user keeps scrolling to top many times (amount specified below)
  private readonly LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT = 4; // after this amount of loads (scrolls), the amount will change to the INCREASED_ one

  // DISPLAYED DATA
  public readonly displayedMessages = this.state.displayedMessages; // expected to be sorted from oldest (first) to newest!
  public readonly repliedTexts = this.state.repliedTexts; // map of replied message ID -> text preview

  // MESSAGE STATE (ADDITIONAL METADATA)
  public readonly displayingNewestMessages = this.state.displayingNewestMessages;
  public readonly displayingOldestMessages = this.state.displayingOldestMessages;

  // events
  public messagesWillRefresh = this.state.messagesWillRefresh;
  // additionally, the above signal ISN'T EMITTED after initial loading or teleport. Only the infinite scroll loading!
  public messagesWillInit = this.state.messagesWillInit;
  public newMessageAppeared = this.state.newMessageAppeared;
  public ownMessageSent = this.state.ownMessageSent; // contains success status
  public uploadProgress = this.state.uploadProgress; // 0-100 percentage

  // LOADING PROPERTIES
  public readonly dataLoaded = this.state.dataLoaded; // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = this.state.additionalMessagesLoading; // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = this.state.loadingMessagesAreOlder;
  public readonly loadError = this.state.loadError;

  private convMessagesSub?: Subscription;

  constructor() {
    this.websocket.reloadConversation$.subscribe({
      next: () => this.loadCurrentConversation(),
    });

    this.websocket.reconnected$.subscribe(() => {
      if (document.visibilityState === 'visible') {
        this.websocket.setViewedConversation(this.state.currentConvId === -1 ? null : this.state.currentConvId);
      }
    });
  }

  public getCurrentConvId() {
    return this.state.getCurrentConvId();
  }

  public getLowestDisplayedId() {
    return this.state.getLowestDisplayedId();
  }

  public getHighestDisplayedId() {
    return this.state.getHighestDisplayedId();
  }

  // PRIVATE FUNCTIONS

  // Load messages from the server while managing the state
  private loadConvMessages(
    messageAmount: number,
    older: boolean,
    startMessageId?: number,
    includeGivenId: boolean = false,
  ) {
    const normalizedStartMessageId = this.prepareLoadRequest(startMessageId, older, includeGivenId);

    this.convMessagesSub = this.api.getConversationMessages(
      this.state.currentConvId,
      messageAmount,
      older,
      normalizedStartMessageId
    ).subscribe({
      next: (loadedMessages: Message[]) => {
        this.handleLoadedMessages(loadedMessages, messageAmount, older);
      },
      error: (err) => {
        this.handleLoadError(err);
      }
    });
  }

  private prepareLoadRequest(startMessageId?: number, older: boolean = true, includeGivenId: boolean = false) {
    this.cancelMessageLoad();
    this.state.loadError.set(null);
    this.state.loadingMessagesAreOlder.set(startMessageId !== undefined && startMessageId < this.state.highestDisplayedId);
    this.state.additionalMessagesLoading.set(true);

    if (startMessageId === undefined || !includeGivenId) return startMessageId;
    return startMessageId + (older ? 1 : -1);
  }

  private async handleLoadedMessages(loadedMessages: Message[], messageAmount: number, older: boolean) {
    const displayedMessagesWereEmpty = this.state.displayedMessages().length === 0;
    if (!displayedMessagesWereEmpty) {
      this.state.messagesWillRefresh.next();
    }

    const mergedMessages = mergeLoadedMessages(loadedMessages, this.state.displayedMessages(), older);
    const trimmedMessages = trimOverflowMessages(
      mergedMessages,
      this.MAX_MESSAGES_DISPLAYED,
      this.state.lowestDisplayedId,
      this.state.highestDisplayedId
    );
    this.updateMetadataAfterLoad(trimmedMessages, loadedMessages.length, messageAmount, older);
    const mappedViews = mapMessagesToView(trimmedMessages, this.authService.getUserIdOrError());
    let messagesWithFiles: undefined | MessageView[] = undefined;
    try {
      messagesWithFiles = await this.fileLoader.loadFilesForMessages(mappedViews, this.state.currentConvId);
    } catch (e) {
      console.error("Failed to load message files: " + e);
    }
    this.state.displayedMessages.set(messagesWithFiles ?? mappedViews);
      
    this.handleSuccessfulLoad(displayedMessagesWereEmpty);
  }

  private updateMetadataAfterLoad(messages: Message[], loadedCount: number, requestedCount: number, older: boolean) {
    const metadataUpdateFlags = getMetadataUpdateFlags(
      older,
      loadedCount,
      requestedCount,
      this.state.loadsCount
    );

    this.state.updateDisplayedMessagesMetadata(
      messages,
      metadataUpdateFlags.updateConvNewestMessageId,
      metadataUpdateFlags.updateConvOldestMessageId
    );
  }

  private handleSuccessfulLoad(displayedMessagesWereEmpty: boolean) {
    if (this.state.loadsCount === 0) {
      // acknowledge msgs after the first load of newest messages
      this.conversationService.acknowledgeConversationMessages(this.state.currentConvId, this.state.highestDisplayedId);
    }

    this.state.additionalMessagesLoading.set(false);
    this.state.dataLoaded.set(true);

    this.replyPreviewManager.loadMessagePreviews(
      this.state.currentConvId,
      this.state.highestDisplayedId,
      this.state.lowestDisplayedId
    );
    

    if (displayedMessagesWereEmpty) {
      this.state.messagesWillInit.next();
    }
  }

  private handleLoadError(err: any) {
    this.state.dataLoaded.set(true);
    this.state.additionalMessagesLoading.set(false);

    if (this.state.displayedMessages().length === 0) {
      this.state.loadError.set(err.status ?? 'data-unavailable');
      this.state.displayingNewestMessages.set(true);
      this.state.displayingOldestMessages.set(true);
      return;
    }

    this.alertService.displayError(err.status ?? 'data-unavailable');
  }

  private getMessagesToLoadAmount() {
    if (this.state.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT)
      return this.LOADED_MESSAGES_AMOUNT;
    else
      return this.INCREASED_LOADED_MESSAGES_AMOUNT;
  }

  // ------------------------------------------------ PUBLIC LOADING FUNCTIONS ------------------------------------------------

  // load initially or reload (safe even if no conversation is currently displayed)
  loadCurrentConversation() {
    if (this.state.currentConvId === -1) return;
    this.loadConversationInitially(this.state.currentConvId);
  }

  loadConversationInitially(convId: number) {
    this.exitConversation();
    this.state.currentConvId = convId;
    this.state.loadsCount = 0;
    this.state.displayedMessages.set([]);
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, true);
  }

  loadMessagesByStartId(messageId: number, older: boolean) {
    this.state.displayedMessages.set([]);
    this.state.loadsCount++;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, older, messageId, true);
  }

  loadOlderMessages() {
    const loadAmount = this.getMessagesToLoadAmount();
    this.state.loadsCount++;
    this.loadConvMessages(loadAmount, true, this.state.lowestDisplayedId);
  }

  loadNewerMessages() {
    const loadAmount = this.getMessagesToLoadAmount();
    this.state.loadsCount++;
    this.loadConvMessages(loadAmount, false, this.state.highestDisplayedId);
  }

  // ---------------------------------------------------- OTHER GENERAL FUNCTIONS --------------------------------------------------

  // Tells the backend (via a websocket) that the user is actively viewing this conversation. Has to do with push notifications cancelling
  setActiveViewingStatus(activeViewing: boolean) {
    let conversationId = activeViewing ? this.state.currentConvId : null;
    if (conversationId === -1) conversationId = null;
    this.websocket.setViewedConversation(conversationId);
  }

  exitConversation() {
    this.cancelMessageLoad();
    this.state.resetOnExit();
  }

  cancelMessageLoad() {
    if (!this.convMessagesSub) return;

    this.state.additionalMessagesLoading.set(false);
    this.convMessagesSub.unsubscribe();
    this.convMessagesSub = undefined;
  }
}
