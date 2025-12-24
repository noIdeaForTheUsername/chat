import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Profile } from '@app/profiles/profile.interface';
import { ConversationService } from '@app/conversations/conversation-service/conversation.service';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonFooter,
  IonTextarea, IonButton, IonIcon, IonActionSheet, IonFab, IonFabButton, ScrollDetail, } from '@ionic/angular/standalone';
import { Conversation } from '@app/conversations/conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { MessageService } from '../message-service/message.service';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { MessageCardComponent } from './message-card-component/message-card.component';
import { MessageLoadingIndicatorComponent } from './message-loading-indicator/message-loading-indicator.component';
import { ProfilePreviewComponent } from '@app/profiles/profile-preview-component/profile-preview.component';
import { ChatNoteComponent } from './info-note/chat-note.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { LoadingService } from '@app/loading/loading-service/loading.service';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { SelectionToolbarComponent } from '@app/shared/selection/selection-toolbar-component/selection-toolbar.component';
import type { OverlayEventDetail } from '@ionic/core';
import { CornerMenuComponent } from '@app/shared/headers/corner-menu-component/corner-menu.component';
import { ItemButtonComponent } from '@app/shared/inputs/item-button-component/item-button.component';


@Component({
  selector: 'app-chat-page',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonBackButton, IonFooter, IonTextarea, IonButton, IonIcon, IonFab, IonFabButton, IonActionSheet,
    MessageLoadingIndicatorComponent, ProfilePreviewComponent, ChatNoteComponent, TranslatePipe, VisibleNamePipe, MessageCardComponent, LoadingIndicator,
    SelectionToolbarComponent, RouterLink, CornerMenuComponent, ItemButtonComponent],
  providers: [SelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements OnInit, AfterViewInit, OnDestroy {
  // Services
  private translate = inject(TranslateService);
  protected conversationService = inject(ConversationService);
  private profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);
  public selectionService = inject(SelectionService);

  @ViewChild(IonContent) private content!: IonContent;
  @ViewChild('corner_menu') protected cornerMenu!: CornerMenuComponent;
  
  
  // Data
  protected conversationId: number = -1;
  public conversation!: Conversation;
  public participant?: Profile;
  messages = this.messageService.displayedMessages;

  // INITIAL loading
  initialLoading = computed(() => !this.loadingService.dataLoaded());

  // Other signals the UI depends on

  // Displayed data
  enteredMessage = signal<string>("");
  replyingToId = signal<null | number>(null);
  oldestUnreadMessageId = this.messageService.oldestUnreadMessageId;
  // Loading
  messageLoading = this.messageService.additionalMessagesLoading;
  loadingMessagesAreOlder = this.messageService.loadingMessagesAreOlder;
  
  // State
  displayingNewestMessages = this.messageService.displayingNewestMessages;
  displayingOldestMessages = this.messageService.displayingOldestMessages;
  showScrollDownButton = signal(false);

  // Action menu
  actionMessageId = signal<number | null>(null);
  messageActionSheetOpen = signal(false);
  cornerMenuOpen = signal(false);


  // Other control variables
  private firstMessageId: string = "";
  private firstMessageTopDistance: number = -1;  // for infinite scroll correction
  private scrollElement!: HTMLElement;

  // ------------------------------------------- INIT/LOAD FUNCTIONS -------------------------------------------

  constructor(private route: ActivatedRoute)
  {
    // Get participant and conversation data
    let id = this.route.snapshot.paramMap.get('id');
    if (id === null || isNaN(parseInt(id))) {
      this.loadingService.reportError("bad-url");
      return;
    }
    this.conversationId = parseInt(id);
    
    // Load conversation messages
    this.messageService.loadConversationInitially(this.conversationId, () => undefined);

    // One-time finish function call after everything is loaded
    effect(() => {
      const initialLoadingInProgress = this.initialLoading();
      if (!initialLoadingInProgress) {
        this.finishLoading();
      }
    });
  }

  ngOnInit(): void {
    this.loadingService.setDataSources(this.profileService, this.conversationService, this.messageService);
  }

  ngAfterViewInit(): void {
    this.initScrollElement();
  }
  private async initScrollElement() {
    this.scrollElement = await this.content.getScrollElement();
  }

  private finishLoading() {
    this.conversation = this.conversationService.getConversationById(this.conversationId);
    this.messageService.setOldestUnreadMessageId(this.conversation.newestMessageReadId || null);
    this.participant = this.profileService.getProfile(this.conversation.participantId);
    requestAnimationFrame(() => this.scrollToBottom(0));
  }

  // ------------------------------------------- MESSAGE SENDING FUNCTIONS -------------------------------------------

  onMessageFieldInput($event: Event) {
    const val = ($event.target as HTMLIonTextareaElement).value;
    if (typeof val != "string") this.enteredMessage.set("");
    else this.enteredMessage.set(val);
  }

  // ------------------------------------------- SCROLL-RELATED FUNCTIONS -------------------------------------------

  onScroll(event: CustomEvent<ScrollDetail>) {
    // Handle message loading
    if (!this.messageLoading()) {
      if (event.detail.scrollTop < 10 && event.detail.deltaY < 0) this.onInfiniteScrollUp();  // this should set messageLoading to true, preventing the event from calling infinitely
      else if (this.getScrollPxAwayFromBottom() <= 10 && event.detail.deltaY > 0) this.onInfiniteScrollDown();
    }

    // Handle scroll-down button
    this.showScrollDownButton.set(this.getScrollPxAwayFromBottom() > 2000 || !this.displayingNewestMessages());
  }
  onInfiniteScrollUp() {
    if (this.displayingOldestMessages()) return;
    // this.loadingMessagesAreOlder.set(true);
    this.messageService.loadOlderMessages(() => this.correctScrollOnMessageLoad(this));
  }
  onInfiniteScrollDown() {
    if (this.displayingNewestMessages()) return;
    // this.loadingMessagesAreOlder.set(false);
    this.messageService.loadNewerMessages(() => this.correctScrollOnMessageLoad(this));
  }

  onMessageRepliedClick(messageId: number) {
    this.scrollToMessage(messageId);
  }

  scrollToBottom(miliseconds: number = 700, loadFirstMessages = false) {
    if (loadFirstMessages && !this.displayingNewestMessages())
      this.messageService.loadConversationInitially(this.conversationId, () => requestAnimationFrame(() => this.scrollToBottom(1000, false)));
    else
      this.messageService.cancelMessageLoad();
    this.content.scrollToBottom(miliseconds);
  }

  scrollToMessage(messageId: number, alwaysScroll = false) {
    if (messageId <= this.messages()[this.messages().length - 1].id && messageId >= this.messages()[0].id) {
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
      // this.loadingMessagesAreOlder.set(true);
      this.messageService.loadMessagesById(messageId, false, () => requestAnimationFrame(() => this.scrollToMessage(messageId, true)));
    }
  }

  correctScrollOnMessageLoad(self: ChatPage) {
    if (self.loadingMessagesAreOlder()) self.firstMessageId = "msg-" + self.messages()[0].id!;
    else self.firstMessageId = "msg-" + self.messages()[self.messages().length - 1].id!;
    const elem = document.getElementById(self.firstMessageId)!;
    self.firstMessageTopDistance = elem.getBoundingClientRect().top;
    requestAnimationFrame(() => {
      const elem2 = document.getElementById(self.firstMessageId)!;
      const diff = elem2.getBoundingClientRect().top - self.firstMessageTopDistance;
      self.content.scrollByPoint(0, diff, 0);
    });
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

  openMessageActionSheet(messageId: number) {  // Displayed after holding a message
    if (this.selectionService.selectionMode()) {
      this.openMultiselectActionSheet();
      return;
    }
    
    this.actionMessageId.set(messageId);
    let msg = this.messages().find((m) => m.id == messageId);
    if (msg !== undefined && msg.isOwn)
      this.messageActionButtons.set(this.ownMessageActionButtons);
    else
      this.messageActionButtons.set(this.notOwnMessageActionButtons);
    this.messageActionSheetOpen.set(true);
  }

  openMultiselectActionSheet() {
    this.messageActionButtons.set(this.multiselectActionButtons);
    this.messageActionSheetOpen.set(true);
  }

  onMessageActionSheetDismiss(event: CustomEvent<OverlayEventDetail>) {
    this.messageActionSheetOpen.set(false);
    const action = event.detail.data;
    if (event.detail.role == "cancel" || event.detail.role == 'backdrop') { this.actionMessageId.set(null); return; }

    if (action == "selection-mode") this.selectionService.toggleSelectionMode(this.actionMessageId());
    else if (action == "reply" && this.actionMessageId()) this.replyingToId.set(this.actionMessageId());
    else if (action == "copy") this.copySelectedMessageToClipboard(this.actionMessageId()!);
    else if (action == "delete") {} // TODO: IMPLEMENT MESSAGE DELETION
    else if (action == "download") {} // TODO: IMPLEMENT
    this.actionMessageId.set(null);
  }

  public notOwnMessageActionButtons = [ // APPLIES ALSO TO OWN MESSAGE; Displayed after holding other user's message
    {
      text: this.translate.instant("page.chat.message-action.reply"),
      icon: "arrow-redo",
      data: "reply"
    },
    {
      text: this.translate.instant("common.copy-text"),
      icon: "copy",
      data: "copy"
    },
    {
      text: this.translate.instant("common.enter-selection"),
      icon: "checkbox-outline",
      data: "selection-mode"
    },
    {
      text: this.translate.instant("common.cancel"),
      // icon: "close-circle",
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];
  public ownMessageActionButtons = [  // Displayed after holding own message
    {
      text: this.translate.instant("common.delete"),
      icon: "trash",
      role: "destructive",
      cssClass: "danger-text",
      data: "delete"
    },
    ...this.notOwnMessageActionButtons
  ];
  public multiselectActionButtons = [  // Displayed after selecting multiple messages and clicking actions
    {
      text: this.translate.instant("page.chat.message-action.delete-all"),
      icon: "trash",
      role: "destructive",
      cssClass: "danger-text",
      data: "delete"
    },
    {
      text: this.translate.instant("page.chat.message-action.download-all"),
      icon: "download",
      data: "download"
    },
    {
      text: this.translate.instant("common.exit-selection"),
      icon: "checkbox-outline",
      data: "selection-mode"
    },
    {
      text: this.translate.instant("common.cancel"),
      // icon: "close-circle",
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];

  messageActionButtons = signal<any>(this.notOwnMessageActionButtons);

  // ------------------------------------------- OTHER FUNCTIONS -------------------------------------------

  copySelectedMessageToClipboard(messageId: number) {
    const msg = this.messages().find(m => m.id === messageId);
      if (msg && msg.text) {
        navigator.clipboard.writeText(msg.text);
      }
  }

  ngOnDestroy() {
    this.messageService.exitConversation();
  }
}
