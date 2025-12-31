import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { IonCard, IonCardContent, IonIcon, IonNote } from "@ionic/angular/standalone"
import { ChatNoteComponent } from '../info-note/chat-note.component';
import { TranslatePipe } from '@ngx-translate/core';
import { Message } from '@app/messages/message.interface';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { HoldDirective } from '@app/shared/selection/hold-directive/hold.directive';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { Profile } from '@app/profiles/profile.interface';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { MessageView } from './message-view.interface';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss'],
  imports: [IonCard, IonCardContent, IonIcon, ChatNoteComponent, TranslatePipe, IonNote, HoldDirective, VisibleNamePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageCardComponent  implements OnInit {
  static dateFormatter = Intl.DateTimeFormat([], {year: "numeric", month: "2-digit", day: "2-digit"});
  static timeFormatter = Intl.DateTimeFormat([], {hour: '2-digit', minute:'2-digit'});

  // INPUTS
  message = input.required<MessageView>();
  selectionService = input.required<SelectionService>();
  previousMessage = input<MessageView | undefined>();
  unreadNoteAbove = input(false);  // if true, "New messages" note (line) will be displayed above
  // OUTPUTS
  repliedClick = output<number>();
  showActionMenu = output<number>();

  // INTERNAL

  // data
  private profileService = inject(ProfileService);
  // appearance
  protected profile!: Profile;
  protected color: string | undefined;
  protected class = "";
  protected spaceBefore = computed(() => this.previousMessage() && this.previousMessage()!.isOwn != this.message().isOwn && !this.unreadNoteAbove());
  // selection
  private clickLock = false;
  // metadata
  protected displayMetadata = signal(false);
  protected displayedDate = signal("");

  constructor() {
    effect(() => {
      this.loadFormattedMetadata();
    });
  }

  ngOnInit() {
    this.profile = this.profileService.getProfile(this.message().senderId);
    if (this.message().isOwn) {
      this.color = "secondary";
      this.class = "message-card ion-text-right ion-float-right";
    }
    else {
      this.color = undefined;
      this.class = "message-card ion-text-left ion-float-left";
    }
  }

  // Output actions
  protected showActionMenuInternal(id: number, eventPreventDefault?: Event) {
    if (eventPreventDefault) eventPreventDefault.preventDefault();
    this.showActionMenu.emit(id);
  }
  protected toggleItemSelectionInternal(id: number) {
    if (!this.clickLock) this.selectionService().toggleItemSelection(id);
  }
  protected repliedClickInternal(messageId: number) {
    if (!this.selectionService().selectionMode())
      this.repliedClick.emit(messageId);
  }

  // hold directive click lock
  protected setClickLock(value: boolean) {
    this.clickLock = value;
  }

  
  private loadFormattedMetadata() {
    let previousTimestamp = this.previousMessage()?.timestamp;
    let timestamp = this.message().timestamp;

    let previousMessageSentOnOtherDay = true;  // default value (if it's the first message in the chat, we want to show all the info)
    if (previousTimestamp) previousMessageSentOnOtherDay = timestamp.getDate() != previousTimestamp.getDate();

    // Display metadata signal value
    this.displayMetadata.set((!previousTimestamp)  // there is no previous message (1st in chat) OR
      || this.previousMessage()?.senderId != this.message().senderId  // previous message has different sender OR
      || timestamp.getTime() - previousTimestamp.getTime() > 1000 * 300  // previous message was sent a lot of time earlier OR
      || previousMessageSentOnOtherDay!);  // previous message was sent on a different day

    // Displayed date signal value
    let date = "";
    if (previousMessageSentOnOtherDay)
      date += MessageCardComponent.dateFormatter.format(timestamp) + " ";
    date += MessageCardComponent.timeFormatter.format(timestamp);
    this.displayedDate.set(date);
  }
}
