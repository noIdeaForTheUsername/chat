import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConversationService } from '@app/conversations/conversation.service';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ProfilePreviewComponent } from '@app/profiles/profile-preview-component/profile-preview.component';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { CornerMenuComponent } from '@app/shared/headers/corner-menu-component/corner-menu.component';
import { ItemButtonComponent } from '@app/shared/inputs/item-button-component/item-button.component';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { SelectionToolbarComponent } from '@app/shared/selection/selection-toolbar-component/selection-toolbar.component';
import { IonActionSheet, IonBackButton, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonTextarea, IonTitle, IonToolbar, ScrollDetail, IonChip } from '@ionic/angular/standalone';
import type { OverlayEventDetail } from '@ionic/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from '../message-service/message.service';
import { ChatNoteComponent } from './info-note/chat-note.component';
import { MessageActionButtons } from './message-action-buttons';
import { MessageCardComponent } from './message-card-component/message-card.component';
import { MessageLoadingIndicatorComponent } from './message-loading-indicator/message-loading-indicator.component';
import { Conversation } from '@app/conversations/conversation.interface';
import { Profile } from '@app/profiles/profile.interface';
import { firstValueFrom, lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-chat-page',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonBackButton, IonFooter, IonTextarea, IonButton, IonIcon, IonFab, IonFabButton, IonActionSheet,
    MessageLoadingIndicatorComponent, ProfilePreviewComponent, ChatNoteComponent, TranslatePipe, VisibleNamePipe, MessageCardComponent, LoadingIndicator,
    SelectionToolbarComponent, RouterLink, CornerMenuComponent, ItemButtonComponent, IonChip],
  providers: [SelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements AfterViewInit, OnDestroy {
  // DEPENDENCIES
  private translate = inject(TranslateService);
  protected conversationService = inject(ConversationService);
  protected profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  public selectionService = inject(SelectionService);

  // SETTINGS
  private readonly SCROLL_TO_BOTTOM_BUTTON_PX = 1500;
  private readonly SCROLL_TO_BOTTOM_ON_NEW_MESSAGE_PX = 150;

  // HTML elements
  @ViewChild(IonContent) private content!: IonContent;
  @ViewChild("msg_field") protected messageField!: IonTextarea;
  @ViewChild('corner_menu') protected cornerMenu!: CornerMenuComponent;
  private scrollElement!: HTMLElement;
  
  
  // DATA TO DISPLAY
  protected conversationId: number = -1;
  public conversation = signal<Conversation | undefined>(undefined);
  public participant = signal<Profile | undefined>(undefined);
    
  public messages = this.messageService.displayedMessages;
  public repliedTexts = this.messageService.repliedTexts;

  // LOADING
  protected initialLoading = computed(() => !this.messageService.dataLoaded());
  protected loadError = signal<string | number | null>(null);
  protected messageLoadError = this.messageService.loadError;
  protected messageLoading = this.messageService.additionalMessagesLoading;
  protected loadingMessagesAreOlder = this.messageService.loadingMessagesAreOlder;

  // MESSAGE INPUT
  protected enteredMessage = signal<string>("");
  protected replyingToId = signal<null | number>(null);
  protected replyingToText = signal<string>("");

  // DISPLAYED MESSAGES STATE
  protected oldestUnreadMessageId = this.messageService.oldestUnreadMessageId;
  protected displayingNewestMessages = this.messageService.displayingNewestMessages;
  protected displayingOldestMessages = this.messageService.displayingOldestMessages;
  protected showScrollDownButton = signal(false);

  // ACTION MENU
  protected actionMessageId = signal<number | null>(null);
  protected messageActionSheetOpen = signal(false);
  protected cornerMenuOpen = signal(false);

  // SCROLL MANAGEMENT
  private firstMessageId: string = "";
  private firstMessageTopDistance: number | undefined = undefined;  // for infinite scroll correction

  // ------------------------------------------- INIT/LOAD FUNCTIONS -------------------------------------------

  constructor(private route: ActivatedRoute)
  {
    // Get participant and conversation data
    let id = this.route.snapshot.paramMap.get('id');
    if (id === null || isNaN(parseInt(id))) {
      this.loadError.set('bad-url');
      return;
    }
    this.conversationId = parseInt(id);
    
    // Load conversation data
    this.loadConversationData(this.conversationId);

    effect(() => {
      // React to message list changes for scroll management and message acknowledgement
      const msgs = this.messageService.displayedMessages();
      if (msgs.length == 0) return;
      if (this.firstMessageTopDistance === undefined) { // first load
        this.conversationService.ackowledgeConversationMessages(this.conversationId);
        requestAnimationFrame(() => this.content.scrollToBottom(0));
      } else {  // next loads
        this.correctScrollOnMessageLoad();
      }
    });

    effect(() => {
      // Always display updated participant profile data
      const _ = this.profileService.profiles();
      if (this.conversation())
        this.loadParticipant(this.conversation()!.participantId);
    })
  }

  private async loadConversationData(conversationId: number) {
    this.messageService.loadConversationInitially(conversationId);
    try {
      this.conversation.set(await firstValueFrom(
        this.conversationService.getConversationById(conversationId))
      );
      await this.loadParticipant(this.conversation()!.participantId);
    }
    catch (error) {}
  }

  private async loadParticipant(participantId: number) {
    this.participant.set(await lastValueFrom(
      this.profileService.getProfileById(participantId)
    ));
  }

  ngAfterViewInit(): void {
    this.initScrollElement();
  }
  private async initScrollElement() {
    this.scrollElement = await this.content.getScrollElement();
  }

  // ------------------------------------------- MESSAGE SENDING / UPDATING / FUNCTIONS -------------------------------------------

  onMessageFieldInput($event: Event) {
    this.enteredMessage.set(($event.target as HTMLIonTextareaElement).value ?? "");
  }

  onMessageFieldKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const messageText = this.enteredMessage().trim();
    if (messageText.length === 0) return;
    this.messageField.value = "";
    this.enteredMessage.set("");
    const replyingTo = this.replyingToId();
    const replyingToText = this.replyingToText();
    this.messageService.sendMessage(messageText, this.afterMessageSent.bind(this),
      replyingTo ?? undefined, replyingToText ?? undefined);
  }

  afterMessageSent() {
    this.cancelReply();
    this.correctScrollOnMessageSend();
  }

  deleteMessage(id: number) {
    this.messageService.deleteMessage(id);
  }

  // ------------------------------------------- SCROLL-RELATED FUNCTIONS -------------------------------------------

  onScroll(event: CustomEvent<ScrollDetail>) {
    // Handle message loading
    if (!this.messageLoading()) {
      if (event.detail.scrollTop < 10 && event.detail.deltaY < 0) this.onInfiniteScrollUp();  // this should set messageLoading to true, preventing the event from calling infinitely
      else if (this.getScrollPxAwayFromBottom() <= 10 && event.detail.deltaY > 0) this.onInfiniteScrollDown();
    }

    // Handle scroll-down button
    this.showScrollDownButton.set(
      this.getScrollPxAwayFromBottom() > this.SCROLL_TO_BOTTOM_BUTTON_PX
      || !this.displayingNewestMessages());
  }
  onInfiniteScrollUp() {
    if (this.displayingOldestMessages()) return;
    this.messageService.loadOlderMessages(this.saveScrollParams.bind(this));
  }
  onInfiniteScrollDown() {
    if (this.displayingNewestMessages()) return;
    this.messageService.loadNewerMessages(this.saveScrollParams.bind(this));
  }

  onMessageRepliedClick(messageId: number) {
    this.scrollToMessage(messageId);
  }

  scrollToBottom(miliseconds: number = 700, loadFirstMessages = false) {
    if (this.initialLoading()) return;
    if (loadFirstMessages && !this.displayingNewestMessages()) {
      this.messageService.loadConversationInitially(this.conversationId,
        () => requestAnimationFrame(() => this.scrollToBottom(1000, false)));
    }
    else {
      this.messageService.cancelMessageLoad();
    }
    this.content.scrollToBottom(miliseconds);
  }

  scrollToMessage(messageId: number, alwaysScroll = false) {
    if (messageId <= this.messages()[this.messages().length - 1].globalId && messageId >= this.messages()[0].globalId) {
      const elem = document.getElementById("msg-" + messageId);
      if (elem === null) return;

      const elemY = elem.offsetTop;

      let topDistance = elem.getBoundingClientRect().top;
      if (topDistance > 60 && topDistance < this.scrollElement.clientHeight - 50 && !alwaysScroll) { // if (element on screen) and not (alwaysScroll)
        this.highlightElement(elem);
      }
      else {
        this.content.scrollToPoint(null, elemY - 25, 500);
        setTimeout(() => this.highlightElement(elem), 500);
      }
    }
    else {
      this.messageService.loadMessagesByStartId(messageId, false,
        () => requestAnimationFrame(() => this.scrollToMessage(messageId, true)));
    }
  }

  // Saves scroll params for correctScrollOnMessageLoad. Call just BEFORE message list updates
  saveScrollParams() {
    if (this.loadingMessagesAreOlder()) this.firstMessageId = "msg-" + this.messages()[0].globalId!;
    else this.firstMessageId = "msg-" + this.messages()[this.messages().length - 1].globalId!;
    const elem = document.getElementById(this.firstMessageId);
    if (!elem) return;
    this.firstMessageTopDistance = elem.getBoundingClientRect().top;
  }

  // Corrects scroll so the screen doesn't jump on msg reload. Call just AFTER message list updates.
  // Make sure saveScroll params is called just before message list update / this function call
  correctScrollOnMessageLoad() {
    requestAnimationFrame(() => {
      if (this.firstMessageTopDistance === undefined) return;
      const elem2 = document.getElementById(this.firstMessageId);
      if (!elem2) return;
      const diff = elem2.getBoundingClientRect().top - this.firstMessageTopDistance;
      this.content.scrollByPoint(0, diff, 0);
    });
  }

  // After the message is sent, correct the scroll (if the user is at the bottom)
  // Call just before message list update.
  correctScrollOnMessageSend() {
    if (!this.displayingNewestMessages()) return;
    if (this.getScrollPxAwayFromBottom() > this.SCROLL_TO_BOTTOM_ON_NEW_MESSAGE_PX) return;
    requestAnimationFrame(() => 
      this.scrollToBottom(300)
    );
  }

  getScrollPxAwayFromBottom() {
    return this.scrollElement.scrollHeight - this.scrollElement.scrollTop - this.scrollElement.clientHeight;
  }

  // ------------------------------------------- APPEARANCE FUNCTIONS -------------------------------------------

  highlightElement(elem: HTMLElement) {
    elem.classList.remove("highlight-pulse");
    void elem.offsetWidth;
    elem.classList.add("highlight-pulse");
  }

  // ------------------------------------------- MESSAGE SELECTION + OPENABLE MENUS (popover, action sheet) -------------------------------------------

  private actionButtons = new MessageActionButtons(this.translate); 
  protected displayedMessageActionButtons = signal<any>(this.actionButtons.notOwnMessage);

  openMessageActionSheet(messageId: number) {  // Displayed after holding a message
    if (this.selectionService.selectionMode()) {
      this.openMultiselectActionSheet();
      return;
    }
    
    this.actionMessageId.set(messageId);
    let msg = this.messages().find((m) => m.globalId == messageId);
    if (msg !== undefined && msg.isOwn)
      this.displayedMessageActionButtons.set(this.actionButtons.ownMessage);
    else
      this.displayedMessageActionButtons.set(this.actionButtons.notOwnMessage);
    this.messageActionSheetOpen.set(true);
  }

  openMultiselectActionSheet() {
    this.displayedMessageActionButtons.set(this.actionButtons.multiselect);
    this.messageActionSheetOpen.set(true);
  }

  // -------------------------------------------------------------------------------------- MESSAGE ACTIONS -------------------------------------------
  onMessageActionSheetDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.messageActionSheetOpen.set(false);
    const action = event.detail.data;
    if (event.detail.role == "cancel" || event.detail.role == 'backdrop') { this.actionMessageId.set(null); return; }

    if (action == "selection-mode") this.selectionService.toggleSelectionMode(this.actionMessageId());
    else if (action == "reply" && this.actionMessageId()) this.replyToMessage(this.actionMessageId()!);
    else if (action == "copy") this.copySelectedMessageToClipboard(this.actionMessageId()!);
    else if (action == "delete") {
      if (this.selectionService.selectionMode()) {
        this.messageService.deleteMultipleMessages(this.selectionService.selectedIds());
        this.selectionService.clearSelection();
        return;
      }
      else this.messageService.deleteMessage(this.actionMessageId()!);
    }
    else if (action == "download") {} // TODO: IMPLEMENT
    this.actionMessageId.set(null);
  }

  replyToMessage(id: number) {
    this.replyingToId.set(this.actionMessageId());
    this.replyingToText.set(this.messages().find(m => m.globalId === id)?.text || "");
  }
  cancelReply() {
    this.replyingToId.set(null);
  }

  // ------------------------------------------- OTHER FUNCTIONS -------------------------------------------

  async copySelectedMessageToClipboard(messageId: number) {
    const msg = this.messages().find(m => m.globalId === messageId);
    if (!msg || !msg.text) return;

    try {
      if (navigator.clipboard) {  // the easy way
        await navigator.clipboard.writeText(msg.text);
      }
      else {  // the fallback way
        const textarea = document.createElement("textarea");
        textarea.value = msg.text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    }
    catch (err) {
      window.alert(`${this.translate.instant("page.chat.copy-failed")}
      \n${msg.text}`);
    }
  }

  ngOnDestroy() {
    this.conversationService.loadMessagePreviews();
    this.messageService.exitConversation();
  }
}
