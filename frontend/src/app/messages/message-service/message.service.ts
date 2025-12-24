import { effect, Injectable, signal } from '@angular/core';
import { Message } from '@app/messages/message.interface';
import { BackendMessageApi } from './backend-message-api';
import { Subscription } from 'rxjs';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { Conversation } from '@app/conversations/conversation.interface';
// import { LoadingService } from '../loading/loading.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements LoadingStatus {

  // PRIVATE SETTINGS
  private readonly MAX_MESSAGES_DISPLAYED = 200;
  private readonly LOADED_MESSAGES_AMOUNT = 25;  // loaded messages per one top-scroll
  private readonly INCREASED_LOADED_MESSAGES_AMOUNT = 75;  // per one top-scroll, if the user keeps scrolling to top many times (amount specified below)
  private readonly LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT = 4; // after this amount of loads (scrolls), the amount will change to the INCREASED_ one

  // PRIVATE PROPERTIES
  private readonly api: BackendMessageApi;
  private currentConv!: Conversation;
  private currentConvId: number = -1;

  private convMessagesSub?: Subscription;
  private loadsCount: number = 0;

  private lowestDisplayedId: number = -1; public getLowestDisplayedId() { return this.lowestDisplayedId };
  private highestDisplayedId: number = -1; public getHighestDisplayedId() { return this.highestDisplayedId };
  //private currentConvOldestMessageId: number = 1;
  private currentConvNewestMessageId: number = 1;
  private storedOldestUnreadMessageId = signal<number | null>(null);  // might be different than real due to message removals



  // PUBLIC PROPERTIES
  public readonly displayedMessages = signal<readonly Message[]>([]);  // expected to be sorted from oldest to newest!
  public readonly displayingNewestMessages = signal(true);
  public readonly displayingOldestMessages = signal(false);
  public readonly oldestUnreadMessageId = signal<number | null>(null);

  // loading-related public properties
  public readonly dataLoaded = signal(false);  // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = signal(true);  // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = signal(true);
  public readonly loadErrorCode = signal<number | null>(null);

  constructor() {
    this.api = new BackendMessageApi();

    effect(() => {
      const dataLoaded = this.dataLoaded();
      const storedOldestUnreadMessageId = this.storedOldestUnreadMessageId();
      if (dataLoaded && this.loadsCount == 0) {
        this.currentConvNewestMessageId = this.highestDisplayedId;
        this.displayingNewestMessages.set(this.highestDisplayedId == this.currentConvNewestMessageId);
      }
      if (dataLoaded && storedOldestUnreadMessageId !== null) {
        this.getRealOldestUnreadMessageId();
      }
    });
  }

  // PRIVATE FUNCTIONS

  private getRealOldestUnreadMessageId() {
    // Find the oldest unread message (we trust that a higher ID always means "newer")
    // (it has to be done manually because that message and the other ones might have been removed)
    if (this.storedOldestUnreadMessageId() === null) return;
    for (let i = this.displayedMessages().length - 1; i >= 0; i--) {
      if (this.displayedMessages()[i].id <= this.storedOldestUnreadMessageId()!) {  // found READ message
        if (i == this.displayedMessages().length - 1) {
          break;  // this will be reached if the 1st unread message and everything near it get removed
          // TODO: inform the server that all messages are read (optionally - maybe just implement an auto-check on the server instead?)
        }
        this.oldestUnreadMessageId.set(this.displayedMessages()[i + 1].id);
        break;
      }
    }
  }

  private loadConvMessages(startMessageId: number, messageNumber: number, older: boolean,
    callBeforeComplete: Function = () => undefined, includeGivenId: boolean = false) {
    this.cancelMessageLoad();
    this.loadingMessagesAreOlder.set(startMessageId < this.highestDisplayedId);
    this.additionalMessagesLoading.set(true);
    this.convMessagesSub = this.api.getConversationMessages(this.currentConvId, startMessageId, messageNumber, older, includeGivenId).subscribe({
      next: (val: Message[]) => {
        callBeforeComplete();

        const newArr = older ? [...val, ...this.displayedMessages()] : [...this.displayedMessages(), ...val];
        // Delete excessive messages
        let overflow = newArr.length - this.MAX_MESSAGES_DISPLAYED;
        if (overflow > 0 && newArr[0].id < this.lowestDisplayedId) {  // if loaded older messages (lowestDisplayedId refers to the previous state)
          newArr.splice(newArr.length - overflow, overflow);
        }
        else if (overflow > 0 && newArr[newArr.length - 1].id > this.highestDisplayedId) {  // if loaded newer messages
          newArr.splice(0, overflow);
        }

        this.displayedMessages.set(newArr);

        this.lowestDisplayedId = newArr.length > 0 ? newArr[0].id : 0;
        this.highestDisplayedId = newArr.length > 0 ? newArr[newArr.length - 1].id : 0;
        this.displayingNewestMessages.set(this.highestDisplayedId == this.currentConvNewestMessageId);
        this.displayingOldestMessages.set(older && val.length < messageNumber);

        this.additionalMessagesLoading.set(false);
        this.dataLoaded.set(true);
      },
      error: (err) => {
        this.loadErrorCode.set(err.status);
      }
    });
  }

  // PUBLIC FUNCTIONS

  loadData() {
    if (this.currentConvId == -1) return;
    this.loadConversationInitially(this.currentConvId);
  }

  loadConversationInitially(convId: number, callBeforeComplete: Function = () => undefined) {
    this.exitConversation();
    this.currentConvId = convId;
    this.loadConvMessages(-1, this.LOADED_MESSAGES_AMOUNT, true, callBeforeComplete);
  }

  loadMessagesById(messageId: number, older: boolean, callBeforeComplete: Function = () => undefined) {
    this.displayedMessages.set([]);
    this.loadsCount++;
    this.loadConvMessages(messageId, this.LOADED_MESSAGES_AMOUNT, older, callBeforeComplete, true);
  }

  setOldestUnreadMessageId(id: number | null) {  // for unread messages / "New messages" note display
    this.storedOldestUnreadMessageId.set(id);
  }

  loadOlderMessages(callBeforeComplete: Function = () => undefined) {
    let loadAmount = this.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT ? this.LOADED_MESSAGES_AMOUNT : this.INCREASED_LOADED_MESSAGES_AMOUNT;
    this.loadsCount++;
    this.loadConvMessages(this.lowestDisplayedId, loadAmount, true, callBeforeComplete);
  }

  loadNewerMessages(callBeforeComplete: Function = () => undefined) {
    let loadAmount = this.loadsCount < this.LOADS_BEFORE_INCREASING_LOADED_MESSAGES_AMOUNT ? this.LOADED_MESSAGES_AMOUNT : this.INCREASED_LOADED_MESSAGES_AMOUNT;
    this.loadsCount++;
    this.loadConvMessages(this.highestDisplayedId, loadAmount, false, callBeforeComplete);
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
