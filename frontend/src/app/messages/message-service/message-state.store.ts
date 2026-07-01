import { Injectable, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { Message } from '../message.interface';
import { MessageView } from '../message-view.interface';

@Injectable({
  providedIn: 'root'
})
export class MessageStateStore {

  // DISPLAYED DATA
  public readonly displayedMessages = signal<MessageView[]>([]); // expected to be sorted from oldest (first) to newest!
  public readonly repliedTexts = signal<Map<number, string>>(new Map()); // map of replied message ID -> text preview

  // MESSAGE STATE (ADDITIONAL METADATA)
  public readonly displayingNewestMessages = signal(true);
  public readonly displayingOldestMessages = signal(false);

  public currentConvId: number = -1;
  public lowestDisplayedId: number = -1;
  public highestDisplayedId: number = -1;
  public currentConvNewestMessageId: number = 1;
  public currentConvOldestMessageId: number = 1;
  public loadsCount: number = 0; // number of additional loads since initial conversation load

  public uploadSubscription: Subscription | null = null; // subscription to the current file upload progress observable

  // events
  public messagesWillRefresh = new Subject<void>();
  public messagesDidRefresh = new Subject<void>();
  // additionally, the above signal ISN'T EMITTED after initial loading or teleport. Only the infinite scroll loading!
  public messagesWillInit = new Subject<void>();
  public newMessageAppeared = new Subject<void>();
  public ownMessageSent = new Subject<boolean>(); // contains success status
  public uploadProgress = new Subject<number>(); // 0-100 percentage

  // LOADING PROPERTIES
  public readonly dataLoaded = signal(false); // specifies if the initial loading was successful
  public readonly additionalMessagesLoading = signal(true); // informs if new messages (during infinite scroll) are just being loaded
  public readonly loadingMessagesAreOlder = signal(true);
  public readonly loadError = signal<string | number | null>(null);

  public getCurrentConvId() {
    return this.currentConvId;
  }

  public getLowestDisplayedId() {
    return this.lowestDisplayedId;
  }

  public getHighestDisplayedId() {
    return this.highestDisplayedId;
  }

  public updateDisplayedMessagesMetadata(
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

  public resetOnExit() {
    this.displayedMessages.set([]);
    this.dataLoaded.set(false);
    this.loadError.set(null);
    this.currentConvId = -1;
    this.loadsCount = 0;
    this.updateDisplayedMessagesMetadata([]);
  }
}
