import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Conversation } from '@app/conversations/conversation.interface';
import { ConversationService } from '@app/conversations/conversation.service';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ProfilePreviewComponent } from '@app/profiles/profile-preview-component/profile-preview.component';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { AnyProfile } from '@app/profiles/profile.interface';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { CornerMenuComponent } from '@app/shared/headers/corner-menu-component/corner-menu.component';
import { ItemButtonComponent } from '@app/shared/inputs/item-button-component/item-button.component';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { SelectionToolbarComponent } from '@app/shared/selection/selection-toolbar-component/selection-toolbar.component';
import { IonActionSheet, IonBackButton, IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonProgressBar, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, ScrollDetail } from '@ionic/angular/standalone';
import type { OverlayEventDetail } from '@ionic/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';
import { AlertType } from '@src/app/alerts/alert-type.enum';
import { MediaViewerComponent } from "@src/app/files/components/media-viewer-component/media-viewer.component";
import { FileCompressorService } from '@src/app/files/services/sending/file-compressor';
import { FilesSelectionService } from '@src/app/files/services/sending/files-selection-service';
import { isTouchOnlyDevice } from '@src/app/shared/platform-detection/platformUtils';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MessageCardComponent } from '../message-card/message-card.component';
import { MessageService } from '../message-service/message.service';
import { MessageActionButtons } from './message-action-buttons';
import { MessageLoadingIndicatorComponent } from './message-loading-indicator/message-loading-indicator.component';


@Component({
  selector: 'app-chat-page',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonSelect, IonSelectOption,
    IonBackButton, IonFooter, IonTextarea, IonButton, IonIcon, IonFab, IonFabButton, IonActionSheet,
    MessageLoadingIndicatorComponent, ProfilePreviewComponent, TranslatePipe, VisibleNamePipe, MessageCardComponent, LoadingIndicator,
    SelectionToolbarComponent, RouterLink, CornerMenuComponent, ItemButtonComponent, IonChip, IonProgressBar, MediaViewerComponent],
  providers: [SelectionService, FilesSelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements AfterViewInit, OnDestroy {
  // DEPENDENCIES
  private translate = inject(TranslateService);
  protected conversationService = inject(ConversationService);
  protected profileService = inject(ProfileService);
  private messageService = inject(MessageService);
  public selectionService = inject(SelectionService);
  private alertService = inject(AlertService);
  private fileCompressor = inject(FileCompressorService);
  private filesSelectionService = inject(FilesSelectionService);

  // SETTINGS
  private readonly SCROLL_TO_BOTTOM_BUTTON_PX = 1500;
  private readonly SCROLL_TO_BOTTOM_ON_NEW_MESSAGE_PX = 150;

  // HTML elements
  @ViewChild(IonContent) private content!: IonContent;
  @ViewChild("message_field") protected messageField!: IonTextarea;
  @ViewChild('corner_menu') protected cornerMenu!: CornerMenuComponent;
  @ViewChild('quality_select') protected qualitySelect!: IonSelect;
  private scrollElement!: HTMLElement;
  
  // File input (hidden)
  private fileInput!: HTMLInputElement;
  
  
  // DATA TO DISPLAY
  protected conversationId: number = -1;
  public conversation = signal<Conversation | undefined>(undefined);
  public participant = signal<AnyProfile | undefined>(undefined);
    
  public messages = this.messageService.displayedMessages;
  public repliedTexts = this.messageService.repliedTexts;

  // LOADING
  protected initialLoading = computed(() => !this.messageService.dataLoaded());
  protected metadataLoadError = signal<string | number | null>(null);
  protected messageLoadError = this.messageService.loadError;
  protected messageLoading = this.messageService.additionalMessagesLoading;
  protected loadingMessagesAreOlder = this.messageService.loadingMessagesAreOlder;

  // MESSAGE INPUT
  protected enteredMessage = signal<string>("");
  protected awaitingMessageSendResponse = signal(false);
  protected canSendMessage = computed(() =>
    (!this.initialLoading())
    && (this.enteredMessage().length > 0 || this.selectedFiles().length > 0)
    && !this.awaitingMessageSendResponse());  
  protected replyingToId = signal<null | number>(null);
  protected replyingToText = signal<string>("");

  // FILE ATTACHMENT
  protected selectedFiles = this.filesSelectionService.selectedFiles;
  protected uploadProgress = signal<number>(0);
  protected attachmentText = computed(() => {
    const count = this.selectedFiles().length;
    if (count === 0) return "";
    return this.translate.instant(count === 1 ? 'page.chat.attachment-one' : 'page.chat.attachment-many', { count });
  });

  // DISPLAYED MESSAGES STATE
  protected firstMessageLoad = true;
  protected displayingNewestMessages = this.messageService.displayingNewestMessages;
  protected displayingOldestMessages = this.messageService.displayingOldestMessages;
  protected showScrollDownButton = signal(false);

  // EVENT LISTENERS
  private visibilityChangedListener: (() => void) | null = null;
  private fileInputChangeListener: ((event: Event) => void) | null = null;

  // ACTION MENU
  protected actionMessageId = signal<number | null>(null);
  protected messageActionSheetOpen = signal(false);
  protected cornerMenuOpen = signal(false);

  // SCROLL MANAGEMENT
  private performScrollCorrection = false;
  private firstMessageId: string = "";
  private firstMessageTopDistance: number | undefined = undefined;  // for infinite scroll correction
  private teleportingToMessageId: number | null = null;  // for scrollToMessage after conversation reload (eg. after sending a message)

  protected get qualitySelectAlertOptions() {
    return {
      header: this.translate.instant("page.chat.quality-options.title"),
      message: this.translate.instant("page.chat.quality-options.hint"),
    };
  }

  // ------------------------------------------- INIT/LOAD FUNCTIONS -------------------------------------------

  constructor(private route: ActivatedRoute, private ngZone: NgZone)
  {
    // Get participant and conversation data
    let id = this.route.snapshot.paramMap.get('id');
    if (id === null || isNaN(parseInt(id))) {
      this.metadataLoadError.set('bad-url');
      return;
    }
    this.conversationId = parseInt(id);
    
    // Load conversation data
    this.loadConversationData(this.conversationId);
    

    this.messageService.messagesDidRefresh.subscribe(() => {
      // React to message list changes for scroll management and message acknowledgement
      const msgs = this.messageService.displayedMessages();
      if (msgs.length == 0) return;
      if (this.firstMessageLoad) { // first load (saveScrollParams never called before)
        this.firstMessageLoad = false;
      } else if (this.performScrollCorrection) {  // next loads
        this.correctScrollOnMessageLoad();
        this.performScrollCorrection = false;
      }
    });

    effect(() => {
      // Always display updated participant profile data
      const _ = this.profileService.profiles();
      if (this.conversation())
        this.loadParticipant(this.conversation()!.participantId);
    });
    effect(() => {
      const enteredMsg = this.enteredMessage();
      if (!this.messageField)
        return;
      this.messageField.value = enteredMsg;
    });
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

  private initSubscriptions() {
    // New message sent / received
    this.messageService.newMessageAppeared.subscribe(() => {
      this.correctScrollOnNewMessage();
    });

    // Own message sent (server responded)
    this.messageService.ownMessageSent.subscribe((success: boolean) => {
      this.afterOwnMessageSent(success);
    });

    // Upload progress
    this.messageService.uploadProgress.subscribe((progress: number) => {
      this.uploadProgress.set(progress);
    });

    this.messageService.messagesWillRefresh.subscribe(async () => {
      this.saveScrollParams();
    });
    // messagesWillRefresh is called when additional messages are about to load
    // messagesWillInit is called when the displayed list was completely (re)loaded (teleport on reply click or initial load)

    this.messageService.messagesWillInit.subscribe(async () => {
      if (this.teleportingToMessageId) {
        await this.waitForDomStable();
        this.scrollToMessage(this.teleportingToMessageId, true);
        this.teleportingToMessageId = null;
      }
      else this.scrollToBottom(0, false); 
    });
  }

  ngAfterViewInit(): void {
    this.initScrollElement();
    this.initSubscriptions();
    this.filesSelectionService.reset();
  }
  private async initScrollElement() {
    this.scrollElement = await this.content.getScrollElement();
  }

  private waitForDomStable(): Promise<void> {
    return firstValueFrom(this.ngZone.onStable);
  }

  // ------------------------------------------- ACTIVE VIEWING STATUS MANAGEMENT -------------------------------------------

  ionViewDidEnter() {
    this.visibilityChangedListener = this.updateActiveViewingStatus.bind(this);
    this.messageService.setActiveViewingStatus(true);
    document.addEventListener('visibilitychange', this.visibilityChangedListener);
  }

  ionViewWillLeave() {
    document.removeEventListener('visibilitychange', this.visibilityChangedListener!);
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', this.fileInputChangeListener!);
      document.body.removeChild(this.fileInput);
    }
    this.messageService.setActiveViewingStatus(false);
  }

  private updateActiveViewingStatus() {
    const val = document.visibilityState === 'visible';
    this.messageService.setActiveViewingStatus(val);
  }

  // ------------------------------------------- MESSAGE SENDING / UPDATING / FUNCTIONS -------------------------------------------

  onMessageFieldInput($event: Event) {
    this.enteredMessage.set(($event.target as HTMLIonTextareaElement).value ?? "");
  }

  onMessageFieldKeydown(event: KeyboardEvent) {
    if ((!isTouchOnlyDevice()) && event.key === "Enter" && !event.shiftKey) {
      // if the device is touch-only, allow the user to use the "Enter" key to create new lines (it's assumed that a
      // touch-only device doesn't have a physical keyboard, and "Enter" on physical keyboard usually means "send message")
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const messageText = this.enteredMessage().trim();
    if (messageText.length === 0 && this.selectedFiles().length === 0)
      return;
    this.awaitingMessageSendResponse.set(true);
    
    // If files are selected, use sendMessageWithFiles
    if (this.selectedFiles().length > 0) {
      this.fileCompressor.enableCompression.set(this.qualitySelect.value !== "not-compressed");
      await this.messageService.operations.sendMessageWithFiles(
        this.selectedFiles(),
        messageText.length > 0 ? messageText : undefined,
        this.replyingToId() ?? undefined
      );
    } else {
      this.messageService.operations.sendMessage(messageText, this.replyingToId() ?? undefined);
    }
  }

  afterOwnMessageSent(success: boolean) {
    this.awaitingMessageSendResponse.set(false);
    if (!success) return;
    
    this.enteredMessage.set("");
    this.cancelReply();
    this.clearAttachmentsAndCancelUpload(); 
    setTimeout(() => this.messageField.setFocus(), 100);
  }

  // ------------------------------------------- FILE ATTACHMENT FUNCTIONS -------------------------------------------
  

  protected onCompressionSettingChange(event: CustomEvent) {
    this.fileCompressor.enableCompression.set(event.detail.value !== 'not-compressed');
  }

  onAttachmentButtonClick() {
    this.filesSelectionService.openSelectionPrompt();
  }

  @HostListener('document:drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    document.body.classList.remove('drag');
    this.filesSelectionService.handleDrop(event);
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    this.filesSelectionService.handlePaste(event);
  }

  clearAttachmentsAndCancelUpload() {
    this.messageService.operations.cancelFileUpload();
    this.filesSelectionService.reset();
    this.uploadProgress.set(0);
    this.awaitingMessageSendResponse.set(false);
  }

  protected onBackButtonClickDuringMessageSending() {
    if (this.awaitingMessageSendResponse()) {
      this.alertService.displayPromptAlert(
        AlertType.DANGER_PROMPT,
        this.translate.instant('page.chat.cancel-sending-confirm.description'),
        () => {
          this.clearAttachmentsAndCancelUpload();
          this.cancelReply();
          this.enteredMessage.set("");
          this.awaitingMessageSendResponse.set(false);
        },
        undefined,
        this.translate.instant('page.chat.cancel-sending-confirm.header')
      );
    }
  }

  // ------------------------------------------- SCROLL-RELATED FUNCTIONS + ADDITIONAL MSG LOADING (on infinite scroll) -------------------------------------------

  onScroll(event: CustomEvent<ScrollDetail>) {
    // Handle message loading
    if (!this.messageLoading()) {
      // this should set messageLoading to true, preventing the event from calling infinitely
      if (event.detail.scrollTop < 10 && event.detail.deltaY < 0) this.onInfiniteScrollUp();
      else if (this.getScrollPxAwayFromBottom() <= 10 && event.detail.deltaY > 0) this.onInfiniteScrollDown();
    }

    // Handle scroll-down button
    this.showScrollDownButton.set(
      this.getScrollPxAwayFromBottom() > this.SCROLL_TO_BOTTOM_BUTTON_PX
      || !this.displayingNewestMessages());
  }
  onInfiniteScrollUp() {
    if (this.displayingOldestMessages()) return;
    this.messageService.loadOlderMessages();
  }
  onInfiniteScrollDown() {
    if (this.displayingNewestMessages()) return;
    this.messageService.loadNewerMessages();
  }

  onMessageRepliedClick(messageId: number) {
    // Angular logs warnings (NG0953) without this "setTimeout" so I guess I'll keep it here
    setTimeout(() => this.scrollToMessage(messageId), 0);
  }

  async scrollToBottom(miliseconds: number = 700, loadFirstMessages = false) {
    if (this.initialLoading()) return;

    if (loadFirstMessages && !this.displayingNewestMessages()) {  // Reload newest messages
      this.firstMessageLoad = true;  // there's an effect() code that will auto-scroll based on this variable
      this.messageService.loadConversationInitially(this.conversationId);
    }
    else {
      this.messageService.cancelMessageLoad();
    }
    await this.waitForDomStable();
    this.content.scrollToBottom(miliseconds);
  }

  async scrollToMessage(messageId: number, alwaysScroll = false) {
    if (messageId <= this.messages()[this.messages().length - 1].globalId && messageId >= this.messages()[0].globalId) {
      const elem = document.getElementById("msg-" + messageId);
      if (elem === null) return;

      const elemY = elem.offsetTop;

      let topDistance = elem.getBoundingClientRect().top;
      if (topDistance > 60 && topDistance < this.scrollElement.clientHeight - 50 && !alwaysScroll) { // if (element on screen) and not (alwaysScroll)
        this.highlightElement(elem);
      }
      else {
        await this.waitForDomStable();
        this.content.scrollToPoint(null, elemY - 25, 500);
        setTimeout(() => this.highlightElement(elem), 500);
      }
    }
    else {
      this.teleportingToMessageId = messageId;
      this.messageService.loadMessagesByStartId(messageId, false);
    }
  }

  // Saves scroll params for correctScrollOnMessageLoad. Call just BEFORE message list updates
  saveScrollParams() {
    this.performScrollCorrection = true;
    if (this.loadingMessagesAreOlder()) this.firstMessageId = "msg-" + this.messages()[0].globalId!;
    else this.firstMessageId = "msg-" + this.messages()[this.messages().length - 1].globalId!;
    const elem = document.getElementById(this.firstMessageId);
    if (!elem) return;
    this.firstMessageTopDistance = elem.getBoundingClientRect().top;
  }

  // Corrects scroll so the screen doesn't jump on msg reload. Call just AFTER message list updates.
  // Make sure saveScroll params is called just before message list update / this function call
  async correctScrollOnMessageLoad() {
    await this.waitForDomStable();
    if (this.firstMessageTopDistance === undefined) return;
    const elem2 = document.getElementById(this.firstMessageId);
    if (!elem2) return;
    const diff = elem2.getBoundingClientRect().top - this.firstMessageTopDistance;
    this.content.scrollByPoint(0, diff, 0);
  }

  // After the message is sent, correct the scroll (if the user is at the bottom)
  // Call just before message list update.
  async correctScrollOnNewMessage() {
    if (!this.displayingNewestMessages()) return;
    if (this.getScrollPxAwayFromBottom() > this.SCROLL_TO_BOTTOM_ON_NEW_MESSAGE_PX) return;
    await this.waitForDomStable();
    await this.scrollToBottom(300);
  }

  getScrollPxAwayFromBottom() {
    return this.scrollElement.scrollHeight - this.scrollElement.scrollTop - this.scrollElement.clientHeight;
  }

  // ------------------------------------------- APPEARANCE FUNCTIONS -------------------------------------------

  protected highlightElement(elem: HTMLElement) {
    if (elem.classList.contains("highlight-pulse")) return;
    elem.classList.add("highlight-pulse");
    setTimeout(() => elem.classList.remove("highlight-pulse"), 1000);
  }

  // Drag response (for file drop)

  @HostListener('document:dragover', ['$event'])
  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    document.body.classList.add('drag');
  }
  
  @HostListener('document:dragleave', ['$event'])
  protected onDragLeave(event: DragEvent) {
    event.preventDefault();
    document.body.classList.remove('drag');
  }
  @HostListener('document:drag', ['$event'])
  protected onDrop2(event: DragEvent) {
    event.preventDefault();
    document.body.classList.remove('drag');
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
      this.deleteSelectedMessages();
    }
    this.actionMessageId.set(null);
  }

  private deleteSelectedMessages() {
    console.warn("DOWNLOAD!");
    if (this.selectionService.selectionMode()) {  // multiselect delete
      this.promptMessageDeletion(() => {
        this.messageService.operations.deleteMultipleMessages(this.selectionService.selectedIds());
        this.selectionService.clearSelection();
      });
    }
    else {  // single delete
      const id = this.actionMessageId();
      this.promptMessageDeletion(() =>  {
        this.messageService.operations.deleteMessage(id!);
        this.actionMessageId.set(null);
      });
    };
  }

  private promptMessageDeletion(confirmCallback: () => void) {
    this.alertService.displayPromptAlert(
      AlertType.DANGER_PROMPT,
      this.translate.instant("prompt.delete-message"),
      confirmCallback);
  }

  replyToMessage(id: number) {
    this.replyingToId.set(this.actionMessageId());
    this.replyingToText.set(this.messages().find(m => m.globalId === id)?.text || "Message");
  }
  cancelReply() {
    if (this.awaitingMessageSendResponse())  // message already being sent
      return;
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
    this.messageService.exitConversation();
  }
}
