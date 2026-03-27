import { inject, Injectable, signal } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { BackendMessageApi } from './backend-message-api';
import { Subject, Subscription } from 'rxjs';
import { MessageView } from '../message-view.interface';
import { AuthService } from '@app/auth/auth.service';
import { messageToMessageView } from '../message-utils';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { ReplyPreviewManager } from './reply-previews';
import { MessageOperations } from './message-operations';
import { WebsocketService } from '../../websockets/websocket-service';
import { ConversationService } from '@src/app/conversations/conversation.service';

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
  public readonly operations = inject(MessageOperations);

  // SETTINGS
  private readonly MAX_MESSAGES_DISPLAYED = 200;
  private readonly LOADED_MESSAGES_AMOUNT = 25; // loaded messages per one top-scroll
  private readonly INCREASED_LOADED_MESSAGES_AMOUNT = 75; // per one top-scroll, if the user keeps scrolling to top many times (amount specified below)
  private readonly LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT = 4; // after this amount of loads (scrolls), the amount will change to the INCREASED_ one

  // DISPLAYED DATA
  public readonly displayedMessages = signal<MessageView[]>([]); // expected to be sorted from oldest (first) to newest!
  public readonly repliedTexts = signal<Map<number, string>>(new Map()); // map of replied message ID -> text preview
  private currentConvId: number = -1;
  public getCurrentConvId() { return this.currentConvId; }

  // MESSAGE STATE (ADDITIONAL METADATA)
  public readonly displayingNewestMessages = signal(true);
  public readonly displayingOldestMessages = signal(false);

  private lowestDisplayedId: number = -1;
  public getLowestDisplayedId() { return this.lowestDisplayedId; }
  private highestDisplayedId: number = -1;
  public getHighestDisplayedId() { return this.highestDisplayedId; }
  private currentConvNewestMessageId: number = 1;
  private currentConvOldestMessageId: number = 1;

  // events
  public messagesWillRefresh = new Subject<void>();
  // additionally, the above signal ISN'T EMITTED after initial loading or teleport. Only the infinite scroll loading!
  public messagesWillInit = new Subject<void>();
  public newMessageAppeared = new Subject<void>();
  public ownMessageSent = new Subject<boolean>(); // contains success status

  // LOADING PROPERTIES
  public readonly dataLoaded = signal(false); // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = signal(true); // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = signal(true);
  public readonly loadError = signal<string | number | null>(null);
  private loadsCount: number = 0; // number of additional loads since initial conversation load
  private convMessagesSub?: Subscription;

  constructor() {
    this.connectCollaborators();

    this.websocket.reloadConversation$.subscribe({
      next: () => this.loadCurrentConversation(),
    });

    this.websocket.reconnected$.subscribe(() => {
      if (document.visibilityState === 'visible') {
        this.websocket.setViewedConversation(this.currentConvId === -1 ? null : this.currentConvId);
      }
    });
  }

  // PRIVATE FUNCTIONS

  private connectCollaborators() {
    this.replyPreviewManager.connect({
      getDisplayedMessages: () => this.displayedMessages(),
      updateDisplayedMessages: (updater) => this.displayedMessages.update(updater),
    });

    this.operations.connect({
      getCurrentConvId: () => this.currentConvId,
      isDisplayingNewest: () => this.displayingNewestMessages(),
      getDisplayedMessages: () => this.displayedMessages(),
      updateDisplayedMessages: (updater) => this.displayedMessages.update(updater),
      getHighestDisplayedId: () => this.highestDisplayedId,
      getLowestDisplayedId: () => this.lowestDisplayedId,
      notifyNewMessageAppeared: () => this.newMessageAppeared.next(),
      notifyOwnMessageSent: (success) => this.ownMessageSent.next(success),
    });
  }

  // Load messages from the server while managing the state
  private loadConvMessages(
    messageAmount: number,
    older: boolean,
    startMessageId?: number,
    includeGivenId: boolean = false,
  ) {
    const normalizedStartMessageId = this.prepareLoadRequest(startMessageId, older, includeGivenId);

    this.convMessagesSub = this.api.getConversationMessages(
      this.currentConvId,
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
    this.loadError.set(null);
    this.loadingMessagesAreOlder.set(startMessageId !== undefined && startMessageId < this.highestDisplayedId);
    this.additionalMessagesLoading.set(true);

    if (startMessageId === undefined || !includeGivenId) return startMessageId;
    return startMessageId + (older ? 1 : -1);
  }

  private handleLoadedMessages(loadedMessages: Message[], messageAmount: number, older: boolean) {
    const displayedMessagesWereEmpty = this.displayedMessages().length === 0;
    if (!displayedMessagesWereEmpty) {
      this.messagesWillRefresh.next();
    }

    const mergedMessages = this.mergeLoadedMessages(loadedMessages, older);
    const trimmedMessages = this.trimOverflowMessages(mergedMessages);
    const mappedViews = this.mapMessagesToView(trimmedMessages);

    this.displayedMessages.set(mappedViews);
    this.updateMetadataAfterLoad(trimmedMessages, loadedMessages.length, messageAmount, older);
    this.handleSuccessfulLoad(displayedMessagesWereEmpty);
  }

  private mergeLoadedMessages(loadedMessages: Message[], older: boolean) {
    return older
      ? [...loadedMessages, ...this.displayedMessages()]
      : [...this.displayedMessages(), ...loadedMessages];
  }

  private trimOverflowMessages(messages: Message[]) {
    const trimmedMessages = [...messages];
    const overflow = trimmedMessages.length - this.MAX_MESSAGES_DISPLAYED;

    if (overflow <= 0) return trimmedMessages;

    if (trimmedMessages[0].globalId < this.lowestDisplayedId) {
      trimmedMessages.splice(trimmedMessages.length - overflow, overflow);
    }
    else if (trimmedMessages[trimmedMessages.length - 1].globalId > this.highestDisplayedId) {
      trimmedMessages.splice(0, overflow);
    }

    return trimmedMessages;
  }

  private mapMessagesToView(messages: Message[]) {
    const currentUserId = this.authService.getUserIdOrError();
    const msgViews: MessageView[] = [];

    for (let i = 0; i < messages.length; i++) {
      msgViews[i] = messageToMessageView(
        messages[i],
        currentUserId,
        i > 0 ? msgViews[i - 1] : undefined
      );
    }

    return msgViews;
  }

  private updateMetadataAfterLoad(messages: Message[], loadedCount: number, requestedCount: number, older: boolean) {
    const updateConvNewestMessageId = (!older && loadedCount < requestedCount) || this.loadsCount === 0;
    const updateConvOldestMessageId = older && loadedCount < requestedCount;

    this.updateDisplayedMessagesMetadata(
      messages,
      updateConvNewestMessageId,
      updateConvOldestMessageId
    );
  }

  private handleSuccessfulLoad(displayedMessagesWereEmpty: boolean) {
    if (this.loadsCount === 0) {
      // acknowledge msgs after the first load of newest messages
      this.conversationService.acknowledgeConversationMessages(this.currentConvId, this.highestDisplayedId);
    }

    this.additionalMessagesLoading.set(false);
    this.dataLoaded.set(true);

    this.replyPreviewManager.loadMessagePreviews(
      this.currentConvId,
      this.highestDisplayedId,
      this.lowestDisplayedId
    );

    if (displayedMessagesWereEmpty) {
      this.messagesWillInit.next();
    }
  }

  private handleLoadError(err: any) {
    this.dataLoaded.set(true);
    this.additionalMessagesLoading.set(false);

    if (this.displayedMessages().length === 0) {
      this.loadError.set(err.status ?? 'data-unavailable');
      this.displayingNewestMessages.set(true);
      this.displayingOldestMessages.set(true);
      return;
    }

    this.alertService.displayError(err.status ?? 'data-unavailable');
  }

  private getMessagesToLoadAmount() {
    if (this.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT)
      return this.LOADED_MESSAGES_AMOUNT;
    else
      return this.INCREASED_LOADED_MESSAGES_AMOUNT;
  }

  private updateDisplayedMessagesMetadata(
    messages: Message[],
    updateConvNewestMessageId = false,
    updateConvOldestMessageId = false
  ) {
    if (messages.length > 0) {
      this.lowestDisplayedId = messages[0].globalId;
      this.highestDisplayedId = messages[messages.length - 1].globalId;

      if (updateConvNewestMessageId) {
        this.currentConvNewestMessageId = this.highestDisplayedId;
      }
      if (updateConvOldestMessageId) {
        this.currentConvOldestMessageId = this.lowestDisplayedId;
      }

      this.displayingNewestMessages.set(this.highestDisplayedId === this.currentConvNewestMessageId);
      this.displayingOldestMessages.set(this.lowestDisplayedId === this.currentConvOldestMessageId);
      return;
    }

    // empty conversation
    this.lowestDisplayedId = -1;
    this.highestDisplayedId = -1;
    this.displayingNewestMessages.set(true);
    this.displayingOldestMessages.set(true);
    this.currentConvNewestMessageId = -1;
    this.currentConvOldestMessageId = -1;
  }

  // ------------------------------------------------ PUBLIC LOADING FUNCTIONS ------------------------------------------------

  // load initially or reload (safe even if no conversation is currently displayed)
  loadCurrentConversation() {
    if (this.currentConvId === -1) return;
    this.loadConversationInitially(this.currentConvId);
  }

  loadConversationInitially(convId: number) {
    this.exitConversation();
    this.currentConvId = convId;
    this.loadsCount = 0;
    this.displayedMessages.set([]);
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, true);
  }

  loadMessagesByStartId(messageId: number, older: boolean) {
    this.displayedMessages.set([]);
    this.loadsCount++;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, older, messageId, true);
  }

  loadOlderMessages() {
    const loadAmount = this.getMessagesToLoadAmount();
    this.loadsCount++;
    this.loadConvMessages(loadAmount, true, this.lowestDisplayedId);
  }

  loadNewerMessages() {
    const loadAmount = this.getMessagesToLoadAmount();
    this.loadsCount++;
    this.loadConvMessages(loadAmount, false, this.highestDisplayedId);
  }

  // ---------------------------------------------------- OTHER GENERAL FUNCTIONS --------------------------------------------------

  // Tells the backend (via a websocket) that the user is actively viewing this conversation. Has to do with push notifications cancelling
  setActiveViewingStatus(activeViewing: boolean) {
    let conversationId = activeViewing ? this.currentConvId : null;
    if (conversationId === -1) conversationId = null;
    this.websocket.setViewedConversation(conversationId);
  }

  exitConversation() {
    this.cancelMessageLoad();
    this.displayedMessages.set([]);
    this.dataLoaded.set(false);
    this.loadError.set(null);
    this.currentConvId = -1;
    this.loadsCount = 0;
    this.updateDisplayedMessagesMetadata([]);
  }

  cancelMessageLoad() {
    if (!this.convMessagesSub) return;

    this.additionalMessagesLoading.set(false);
    this.convMessagesSub.unsubscribe();
    this.convMessagesSub = undefined;
  }
}
