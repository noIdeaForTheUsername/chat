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
import { LoadingService } from '@app/loading/loading-service/loading.service';
import { Router, RouterLink } from '@angular/router';
import type { OverlayEventDetail } from '@ionic/core';
import { profileMatchesSearch } from '@app/profiles/profile-utils';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { SelectionToolbarComponent } from '@app/shared/selection/selection-toolbar-component/selection-toolbar.component';
import { Profile } from '@app/profiles/profile.interface';
import { CornerMenuComponent } from '@app/shared/headers/corner-menu-component/corner-menu.component';
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";

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
  private loadingService = inject(LoadingService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  protected selectionService = inject(SelectionService);

  // Data
  protected conversations = computed(() => this.convertConversations(this.conversationService.conversations(), this.lastMessages()));
  protected displayedConversations = computed(() =>
    this.conversations().filter((conv) => {
      return profileMatchesSearch(this.profiles().get(conv.participantId), this.searchFilter());
    }));
  
  protected lastMessages: Signal<Map<number, Message | null>> = this.conversationService.conversationsLastMessages;
  protected profiles: Signal<Map<number, Profile>> = this.profileService.profiles;

  // Control variables, HTML elements
  protected searchFilter = signal("");
  protected multiselectActionSheetOpen = signal(false);
  protected selectionMode: Signal<boolean> = this.selectionService.selectionMode;
  protected selectedIds: Signal<number[]> = this.selectionService.selectedIds;
  @ViewChild("corner_menu") cornerMenu!: CornerMenuComponent;
  
  // Loading
  protected dataLoaded: Signal<boolean> = this.loadingService.dataLoaded;

  // INIT + LOADING
  ionViewWillEnter() {
    this.loadingService.setDataSources(this.conversationService, this.profileService);
  }

  convertConversations(conversations: Conversation[], lastMessages: Map<number, Message | null>) : ConversationView[] {
    return conversations.map((conv) => {
      let lastMessageId = lastMessages.get(conv.id)?.globalId;
      let lastMessageText: string = lastMessages.get(conv.id)?.text || "";
      let unreadMessages: boolean = (lastMessageId !== undefined && conv.newestMessageReadId !== undefined) ? lastMessageId > conv.newestMessageReadId : false;
      return {
        ...conv,
        lastMessageText: lastMessageText,
        unreadMessages: unreadMessages
      }
    });
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

  performMultiselectAction(event: CustomEvent<OverlayEventDetail>) {
    this.multiselectActionSheetOpen.set(false);
    let action = event.detail.data;
    if (event.detail.role == "cancel" || event.detail.role == 'backdrop') return;
    console.log("performing action: ", event.detail.data);  // TODO: implement

    if (action == "selection-mode") this.selectionService.toggleSelectionMode();
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
    {
      text: this.translate.instant("page.conversations.conversation-action.delete"),
      icon: "person-remove",
      role: "destructive",
      cssClass: "danger-text",
      data: "delete"
    },
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