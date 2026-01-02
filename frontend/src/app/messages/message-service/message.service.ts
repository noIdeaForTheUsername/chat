import { effect, inject, Injectable, signal } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { BackendMessageApi } from './backend-message-api';
import { Subscription } from 'rxjs';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { MessageView } from '../chat-page/message-card-component/message-view.interface';
import { AuthService } from '@app/auth/auth.service';
import { messageToMessageView } from '../message-utils';

// DESCRIPTION: This service doesn't return data. It loads it and manages it internally, providing signals for components to bind to.
// The chatPage manages the UI only, while being directly connected to this service's variables/signals.

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  // DEPENDENCIES
  private authService = inject(AuthService);
  private readonly api = new BackendMessageApi();

  // SETTINGS
  private readonly MAX_MESSAGES_DISPLAYED = 200;
  private readonly LOADED_MESSAGES_AMOUNT = 25;  // loaded messages per one top-scroll
  private readonly INCREASED_LOADED_MESSAGES_AMOUNT = 75;  // per one top-scroll, if the user keeps scrolling to top many times (amount specified below)
  private readonly LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT = 4; // after this amount of loads (scrolls), the amount will change to the INCREASED_ one

  // DISPLAYED DATA
  public readonly displayedMessages = signal<readonly MessageView[]>([]);  // expected to be sorted from oldest (first) to newest!
  private currentConvId: number = -1;

  // MESSAGE STATE (ADDITIONAL METADATA)
  public readonly displayingNewestMessages = signal(true);
  public readonly displayingOldestMessages = signal(false);

  public readonly oldestUnreadMessageId = signal<number | null>(null);
  private storedOldestUnreadMessageId = signal<number | null>(null);  // might be different than real due to message removals

  private lowestDisplayedId: number = -1; public getLowestDisplayedId() { return this.lowestDisplayedId };
  private highestDisplayedId: number = -1; public getHighestDisplayedId() { return this.highestDisplayedId };
  private currentConvNewestMessageId: number = 1;

  // LOADING PROPERTIES
  public readonly dataLoaded = signal(false);  // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = signal(true);  // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = signal(true);
  // public readonly loadErrorCode = signal<number | null>(null);
  private loadsCount: number = 0;  // number of additional loads since initial conversation load
  private convMessagesSub?: Subscription;


  constructor() {
    effect(() => {
      const dataLoaded = this.dataLoaded();
      const storedOldestUnreadMessageId = this.storedOldestUnreadMessageId();
      if (dataLoaded && this.loadsCount == 0) {  // after initial load
        // set the newest message ID for this conversation
        this.currentConvNewestMessageId = this.highestDisplayedId;
        this.displayingNewestMessages.set(true);
      }
      if (dataLoaded && storedOldestUnreadMessageId !== null) {  // after initial load or when unread ID changes
        // setup the real oldest unread message ID (so we know where exactly to put the "New messages" note display)
        this.setupRealOldestUnreadMessageId();
      }
    });
  }

  // PRIVATE FUNCTIONS

  private setupRealOldestUnreadMessageId() {
    // Find the oldest unread message (we trust that a higher ID always means "newer")
    // (it has to be done manually because that message and the other ones might have been removed)
    if (this.storedOldestUnreadMessageId() === null) return;
    for (let i = this.displayedMessages().length - 1; i >= 0; i--) {
      if (this.displayedMessages()[i].globalId <= this.storedOldestUnreadMessageId()!) {  // found READ message
        if (i == this.displayedMessages().length - 1) {
          break;  // this will be reached if the 1st unread message and everything near it get removed
          // TODO: inform the server that all messages are read (optionally - maybe just implement an auto-check on the server instead?)
        }
        this.oldestUnreadMessageId.set(this.displayedMessages()[i + 1].globalId);
        break;
      }
    }
  }

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

        val = val.reverse();  // reverse to be from oldest to newest

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
        this.displayedMessages.set(newArr.map(msg =>
          messageToMessageView(msg, this.authService.getUserIdOrError())));

        // update control variables
        this.lowestDisplayedId = newArr.length > 0 ? newArr[0].globalId : 0;
        this.highestDisplayedId = newArr.length > 0 ? newArr[newArr.length - 1].globalId : 0;
        this.displayingNewestMessages.set(!older && val.length < messageAmount);
        this.displayingOldestMessages.set(older && val.length < messageAmount);
        // notify loading complete
        this.additionalMessagesLoading.set(false);
        this.dataLoaded.set(true);
      },
      error: (err) => {
        this.dataLoaded.set(true);
        this.additionalMessagesLoading.set(false);
        // this.loadErrorCode.set(err.status);
      }
    });
  }

  private getMessagesToLoadAmount() {
    if (this.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT)
      return this.LOADED_MESSAGES_AMOUNT;
    else
      return this.INCREASED_LOADED_MESSAGES_AMOUNT;
  }

  // PUBLIC FUNCTIONS

  loadData() {
    if (this.currentConvId == -1) return;
    this.loadConversationInitially(this.currentConvId);
  }

  loadConversationInitially(convId: number, callBeforeComplete: Function = () => undefined) {
    this.exitConversation();
    this.currentConvId = convId;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, true, callBeforeComplete);
  }

  loadMessagesByStartId(messageId: number, older: boolean, callBeforeComplete: Function = () => undefined) {
    this.displayedMessages.set([]);
    this.loadsCount++;
    this.loadConvMessages(this.LOADED_MESSAGES_AMOUNT, older, callBeforeComplete, messageId, true);
  }

  setOldestUnreadMessageId(id: number | null) {  // for unread messages / "New messages" note display
    this.storedOldestUnreadMessageId.set(id);
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

  sendMessage(text: string, repliedId?: number, callBeforeComplete?: Function) {
    const timestamp = new Date();
    this.api.sendMessage(this.currentConvId, text, timestamp, repliedId).subscribe({
      next: (res: any) => {
        if (res.id === undefined) return;
        if (callBeforeComplete) callBeforeComplete();
        this.displayedMessages.update((msgs) => {
          return [...msgs, {
            globalId: res.id,
            numberInConversation: 0,  // todo in the future
            conversationId: this.currentConvId,
            senderId: this.authService.getUserIdOrError(),
            text: text,
            timestamp,
            isOwn: true,
            repliedId,
          }];
        });
      }
    });
  }

  exitConversation() {
    this.cancelMessageLoad();
    this.displayedMessages.set([]);
    this.dataLoaded.set(false);
    this.storedOldestUnreadMessageId.set(null);
    this.oldestUnreadMessageId.set(null);
    this.loadsCount = 0;
  }

  cancelMessageLoad() {
    if (this.convMessagesSub) {
      this.additionalMessagesLoading.set(false);
      this.convMessagesSub.unsubscribe();
    }
  }
}
