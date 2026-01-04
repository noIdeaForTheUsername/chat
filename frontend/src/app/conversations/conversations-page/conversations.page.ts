import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonSearchbar, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonActionSheet, IonNote } from '@ionic/angular/standalone';
import { LoadingIndicator } from '@app/loading/loading-indicator-component/loading-indicator.component';
import { ConversationService } from '@app/conversations/conversation.service';
import { Conversation } from '@app/conversations/conversation.interface';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Message } from '@app/messages/message.interface';
import { ConversationView } from "./conversation-view.interface";
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import { Router, RouterLink } from '@angular/router';
import type { OverlayEventDetail } from '@ionic/core';
import { profileMatchesSearch } from '@app/profiles/profile-utils';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { SelectionToolbarComponent } from '@app/shared/selection/selection-toolbar-component/selection-toolbar.component';
import { Profile } from '@app/profiles/profile.interface';
import { CornerMenuComponent } from '@app/shared/headers/corner-menu-component/corner-menu.component';
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';

@Component({
  selector: 'app-conversations-page',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonSearchbar, IonFab, IonFabButton, IonIcon, IonNote, IonButtons, IonButton, IonActionSheet,
    LoadingIndicator, ConversationItemComponent, CommonModule, TranslatePipe, SelectionToolbarComponent, CornerMenuComponent, RouterLink, ItemButtonComponent],
  providers: [SelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationsPage {

  // Services
  private conversationService = inject(ConversationService);
  protected profileService = inject(ProfileService);
  private translate = inject(TranslateService);
  protected authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  protected selectionService = inject(SelectionService);

  // Data
  protected conversations = computed(() =>
    this.getConvertedConversations(this.conversationService.conversations(), this.lastMessages())
  );
  protected displayedConversations = computed(() => this.getFilteredConversations(this.conversations()));
  
  protected lastMessages: Signal<Map<number, Message | null>> = this.conversationService.conversationsMessagePreviews;
  protected profiles: Signal<Map<number, Profile>> = this.profileService.profiles;

  // State
  protected conversationsLoaded = this.conversationService.conversationsLoaded;
  protected searchFilter = signal("");
  protected multiselectActionSheetOpen = signal(false);
  protected selectionMode: Signal<boolean> = this.selectionService.selectionMode;
  protected selectedIds: Signal<number[]> = this.selectionService.selectedIds;
  protected showBlockedConversations = signal(false);

  // HTML elements
  @ViewChild("corner_menu") cornerMenu!: CornerMenuComponent;


  // Filters by both search and blocked status, and then sorts
  private getFilteredConversations(conversations: ConversationView[]): ConversationView[] {
    return conversations
      .filter((conv) =>
        profileMatchesSearch(this.profiles().get(conv.participantId), this.searchFilter()))
      .filter((conv) => 
        this.showBlockedConversations() || (!this.getConversationBlocked(conv)))
      .sort((a, b) => {
        // Put blocked conversations first, then sort by last message time (desc)
        const aBlocked = this.getConversationBlocked(a);
        const bBlocked = this.getConversationBlocked(b);
        if (aBlocked && !bBlocked) return -1;
        if (!aBlocked && bBlocked) return 1;

        // Both blocked or both not blocked -> sort by last message time, descending
        let aLastMessage = this.lastMessages().get(a.id);
        let bLastMessage = this.lastMessages().get(b.id);
        let aTime = aLastMessage ? new Date(aLastMessage.timestamp).getTime() : 0;
        let bTime = bLastMessage ? new Date(bLastMessage.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }
  
  private getConvertedConversations(conversations: Conversation[], lastMessages: Map<number, Message | null>) : ConversationView[] {
    return conversations.map((conv) => {
      const lastMessage = lastMessages.get(conv.id);
      let lastMessageId = lastMessage?.globalId;
      let lastMesageSenderId = lastMessage?.senderId;
      let lastMessageText: string = lastMessage?.text || "";
      let unreadMessages: boolean = false;
      if (lastMessageId !== undefined && conv.newestReadMessageId !== undefined) {
        unreadMessages = (lastMessageId > conv.newestReadMessageId
          && lastMesageSenderId !== this.authService.getUserIdOrError());
      }

      return {
        ...conv,
        lastMessageText: lastMessageText,
        unreadMessages: unreadMessages
      }
    });
  }

  toggleBlockedConversations() {
    this.showBlockedConversations.set(!this.showBlockedConversations());
  }

  // UI FUNCTIONS

  onSearchBarInput(event: Event) {
    const input = (event.target as HTMLIonSearchbarElement).value;
    if (typeof(input) == "string") this.searchFilter.set(input);
  }

  performPlusButtonAction(event: CustomEvent<OverlayEventDetail>) {
    if (event.detail.role == "cancel" || event.detail.role == 'backdrop') return;
    this.router.navigate([event.detail.data]);
  }

  openMultiselectActionSheet() {
    this.multiselectActionSheetOpen.set(true);
  }

  getConversationBlocked(conversation: ConversationView): boolean {
    const profile = this.profileService.profiles().get(conversation.participantId);
    if (!profile) {
      this.profileService.getProfileById(conversation.participantId);  // force loading the missing profile but don't delay the return
      return true;  // consider blocked until loaded
    }
    if (profile.type === 'group') return false;
    return profile.blocked;
  }

  performMultiselectAction(event: CustomEvent<OverlayEventDetail>) {
    this.multiselectActionSheetOpen.set(false);
    if (event.detail.role == "cancel" || event.detail.role == 'backdrop') return;
    let action = event.detail.data;

    if (action == "selection-mode") { 
      this.selectionService.toggleSelectionMode();
      return;
    }

    switch (action) {
      case "clear":  // Clear conversations
        this.alertService.displayPromptAlert(
          AlertType.DANGER_PROMPT,
          this.translate.instant("prompt.clear-conversation"),
          () => this.conversationService.clearMultipleConversationMessages(this.selectedIds()));
        break;
    }
  }


  // "Plus" button action menu
  public plusButtons = [
    {
      text: this.translate.instant("page.conversations.plus-action.conversation"),
      icon: "person-add",
      data: "discovery"
    },
    {
      text: this.translate.instant("page.conversations.plus-action.group"),
      icon: "people",
      data: "create-group"
    },
    {
      text: this.translate.instant("common.cancel"),
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];

  public multiselectActionButtons = [
    // {
    //   text: this.translate.instant("page.conversations.conversation-action.delete"),
    //   icon: "person-remove",
    //   role: "destructive",
    //   cssClass: "danger-text",
    //   data: "delete"
    // },
    {
      text: this.translate.instant("page.conversations.conversation-action.clear-messages"),
      icon: "trash-bin",
      role: "destructive",
      cssClass: "danger-text",
      data: "clear"
    },
    {
      text: this.translate.instant("common.exit-selection"),
      icon: "checkbox-outline",
      data: 'selection-mode',
    },
    {
      text: this.translate.instant("common.cancel"),
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];
}