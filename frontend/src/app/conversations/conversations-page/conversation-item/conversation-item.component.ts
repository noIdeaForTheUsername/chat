import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { HoldDirective } from '@app/shared/selection/hold-directive/hold.directive';
import { Profile } from '@app/profiles/profile.interface';
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { SelectionService } from '@app/shared/selection/selection-service/selection.service';
import { IonAvatar, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { ConversationView } from '../conversation-view.interface';
import { ProfileService } from '@src/app/profiles/profile-service/profile.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-conversation-item',
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  imports: [IonAvatar, IonItem, IonIcon, IonLabel, VisibleNamePipe, HoldDirective, TranslatePipe],
})
export class ConversationItemComponent {
  private router = inject(Router);
  private profileService = inject(ProfileService);

  conversationView = input.required<ConversationView>();
  profile = input.required<Profile | undefined>();
  selectionService = input.required<SelectionService>();

  openMultiselectActions = output<void>();

  private clickLock = false;
  protected blocked = computed(() => {
    const p = this.profile();
    return p?.type === 'user' ? p!.blocked : false;
  });

  navigate() {
    if (this.clickLock) return;
    if (this.blocked()) {
      const p = this.profile();
      if (p?.type === 'user') this.profileService.promptUnblockUser(p.id, p.login);
      return;
    }
    if (!this.selectionService().selectionMode()) this.router.navigateByUrl("chats/" + this.conversationView().id.toString());
  }

  // Selection
  onConversationHold(id: number) {
    this.processConversationSelection(id);
  }
  onConversationRightClick(event: MouseEvent, id: number) {
    event.preventDefault();
    this.processConversationSelection(id);
  }
  
  onConversationClick(id: number) {
    if (this.clickLock) return;
    this.selectionService().toggleItemSelection(id);
  }
  setClickLock(value: boolean) {
    this.clickLock = value;
  }

  private processConversationSelection(id: number) {
    if (this.selectionService().selectionMode()) this.openMultiselectActions.emit();
    else this.selectionService().toggleSelectionMode(id);
  }
}
