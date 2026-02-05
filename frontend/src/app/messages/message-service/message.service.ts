import { effect, inject, Injectable, signal } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { BackendMessageApi } from './backend-message-api';
import { Subscription } from 'rxjs';
import { MessageView } from '../message-view.interface';
import { AuthService } from '@app/auth/auth.service';
import { messageToMessageView } from '../message-utils';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { ReplyPreviewManager } from './reply-previews';
import { MessageOperations } from './message-operations';
import { TranslateService } from '@ngx-translate/core';
import { WebsocketService } from '../../websockets/websocket-service';
import { ConversationService } from '@src/app/conversations/conversation.service';

// DESCRIPTION: This service doesn't return data. It loads it and manages it internally, providing signals for components to bind to.
// The chatPage manages the UI only, while being directly connected to this service's variables/signals.

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  // NOTE: This service has all loading functions directly in the file, but other operations are in separate classes

  // DEPENDENCIES
  private translate = inject(TranslateService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private websocket = inject(WebsocketService);
  private conversationService = inject(ConversationService);
  private readonly api = new BackendMessageApi();
  private readonly replyPreviewManager = new ReplyPreviewManager(this, this.api);
  public readonly operations = new MessageOperations(
    this, this.api, this.replyPreviewManager,
    this.authService, this.alertService, this.translate, this.conversationService, this.websocket
  );

  // SETTINGS
  private readonly MAX_MESSAGES_DISPLAYED = 200;
  private readonly LOADED_MESSAGES_AMOUNT = 25;  // loaded messages per one top-scroll
  private readonly INCREASED_LOADED_MESSAGES_AMOUNT = 75;  // per one top-scroll, if the user keeps scrolling to top many times (amount specified below)
  private readonly LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT = 4; // after this amount of loads (scrolls), the amount will change to the INCREASED_ one

  // DISPLAYED DATA
  public readonly displayedMessages = signal<MessageView[]>([]);  // expected to be sorted from oldest (first) to newest!
  public readonly repliedTexts = signal<Map<number, string>>(new Map());  // map of replied message ID -> text preview
  private currentConvId: number = -1; public getCurrentConvId() { return this.currentConvId };

  // MESSAGE STATE (ADDITIONAL METADATA)
  public readonly displayingNewestMessages = signal(true);
  public readonly displayingOldestMessages = signal(false);

  private lowestDisplayedId: number = -1; public getLowestDisplayedId() { return this.lowestDisplayedId };
  private highestDisplayedId: number = -1; public getHighestDisplayedId() { return this.highestDisplayedId };
  private currentConvNewestMessageId: number = 1;
  private currentConvOldestMessageId: number = 1;

  public beforeNewMessageCallback: Function = () => undefined;

  // LOADING PROPERTIES
  public readonly dataLoaded = signal(false);  // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = signal(true);  // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = signal(true);
  public readonly loadError = signal<string | number | null>(null);
  private loadsCount: number = 0;  // number of additional loads since initial conversation load
  private convMessagesSub?: Subscription;


  constructor() {
    // Subscribe to reload messages from the socket service
    this.websocket.reloadConversation$.subscribe({
      next: (convId: number) => {
        this.loadCurrentConversation();
      }
    });
  }

  // PRIVATE FUNCTIONS

  // Load messages from the server while managing the state
  private loadConvMessages(messageAmount: number, older: boolean,
    callBeforeComplete: Function = () => undefined,
    startMessageId?: number, includeGivenId: boolean = false
  ) {
    this.cancelMessageLoad();
    this.loadingMessagesAreOlder.set(startMessageId !== undefined && startMessageId < this.highestDisplayedId);
    this.additionalMessagesLoading.set(true);
    if (startMessageId !== undefined && includeGivenId)
      startMessageId += older ? 1 : -1;

    this.convMessagesSub = this.api.getConversationMessages(this.currentConvId, messageAmount, older, startMessageId).subscribe({
      next: (val: Message[]) => {
        // execute passed callback
        callBeforeComplete();

        // create new displayed messages array
        const newArr = older ? [...val, ...this.displayedMessages()] : [...this.displayedMessages(), ...val];
        // delete excessive messages
        let overflow = newArr.length - this.MAX_MESSAGES_DISPLAYED;
        if (overflow > 0 && newArr[0].globalId < this.lowestDisplayedId) {  // if loaded older messages (lowestDisplayedId refers to the previous state)
          newArr.splice(newArr.length - overflow, overflow);
        }
        else if (overflow > 0 && newArr[newArr.length - 1].globalId > this.highestDisplayedId) {  // if loaded newer messages
          newArr.splice(0, overflow);
        }

        // Map Message -> MessageView
        const msgViews: MessageView[] = [];
        for (let i = 0; i < newArr.length; i++) {
          msgViews[i] = messageToMessageView(
            newArr[i],
            this.authService.getUserIdOrError(),
            i > 0 ? msgViews[i - 1] : undefined
          );
        }
        // UPDATE THE ARRAY
        this.displayedMessages.set(msgViews);

        // update metadata
        const updateHighestDispalyedId = (!older && val.length < messageAmount) || this.loadsCount == 0;
        this.updateDisplayedMessagesMetadata(newArr, updateHighestDispalyedId, older && val.length < messageAmount);

        if (this.loadsCount == 0) {
          // acknowledge msgs after the first load of newest messages
          this.conversationService.acknowledgeConversationMessages(this.currentConvId, this.highestDisplayedId);
        }
        
        // notify loading complete
        this.additionalMessagesLoading.set(false);
        this.dataLoaded.set(true);
        this.replyPreviewManager.loadMessagePreviews(this.currentConvId, this.highestDisplayedId, this.lowestDisplayedId);
      },
      error: (err) => {
        this.dataLoaded.set(true);
        this.additionalMessagesLoading.set(false);
        if (this.displayedMessages().length === 0) {
          this.loadError.set(err.status ?? "data-unavailable");
          this.displayingNewestMessages.set(true);
          this.displayingOldestMessages.set(true);
        }
        else this.alertService.displayError(err.status ?? "data-unavailable");
      }
    });
  }

  private getMessagesToLoadAmount() {
    if (this.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT)
      return this.LOADED_MESSAGES_AMOUNT;
    else
      return this.INCREASED_LOADED_MESSAGES_AMOUNT;
  }

  private updateDisplayedMessagesMetadata(messages: Message[],
    updateConvNewestMessageId = false, updateConvOldestMessageId = false
  ) {
    // update control variables
    if (messages.length > 0) {
      this.lowestDisplayedId = messages[0].globalId;
      this.highestDisplayedId = messages[messages.length - 1].globalId;
      if (updateConvNewestMessageId)
        this.currentConvNewestMessageId = this.highestDisplayedId;
      if (updateConvOldestMessageId)
        this.currentConvOldestMessageId = this.lowestDisplayedId;
      this.displayingNewestMessages.set(this.highestDisplayedId == this.currentConvNewestMessageId);
      this.displayingOldestMessages.set(this.lowestDisplayedId == this.currentConvOldestMessageId);
    }
    else {  // empty conv
      this.lowestDisplayedId = -1;
      this.highestDisplayedId = -1;
      this.displayingNewestMessages.set(true);
      this.displayingOldestMessages.set(true);
      this.currentConvNewestMessageId = -1;
      this.currentConvOldestMessageId = -1;
    }
  }

  
  // ------------------------------------------------ PUBLIC LOADING FUNCTIONS ------------------------------------------------

  // load initially or reload (safe even if no conversation is currently displayed)
  loadCurrentConversation() {
    if (this.currentConvId == -1) return;
    this.loadConversationInitially(this.currentConvId);
  }

  loadConversationInitially(convId: number, callBeforeComplete: Function = () => undefined) {
    this.exitConversation();
    this.currentConvId = convId;
    this.loadsCount = 0;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, true, callBeforeComplete);
  }

  loadMessagesByStartId(messageId: number, older: boolean, callBeforeComplete: Function = () => undefined) {
    this.displayedMessages.set([]);
    this.loadsCount++;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, older, callBeforeComplete, messageId, true);
  }

  loadOlderMessages(callBeforeComplete: Function = () => undefined) {
    let loadAmount = this.getMessagesToLoadAmount();
    this.loadsCount++;
    this.loadConvMessages(loadAmount, true, callBeforeComplete, this.lowestDisplayedId);
  }

  loadNewerMessages(callBeforeComplete: Function = () => undefined) {
    let loadAmount = this.getMessagesToLoadAmount();
    this.loadsCount++;
    this.loadConvMessages(loadAmount, false, callBeforeComplete, this.highestDisplayedId);
  }

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
    this.currentConvId = -1;
    this.loadsCount = 0;
  }

  cancelMessageLoad() {
    if (this.convMessagesSub) {
      this.additionalMessagesLoading.set(false);
      this.convMessagesSub.unsubscribe();
    }
  }
}
