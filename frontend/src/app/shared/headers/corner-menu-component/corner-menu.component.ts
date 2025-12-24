import { ChangeDetectionStrategy, Component, OnInit, signal, ViewChild } from '@angular/core';
import { IonContent, IonList, IonPopover } from '@ionic/angular/standalone';

@Component({
  selector: 'app-corner-menu',
  templateUrl: './corner-menu.component.html',
  styleUrls: ['./corner-menu.component.scss'],
  standalone: true,
  imports: [IonPopover, IonContent, IonList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CornerMenuComponent {

  @ViewChild('corner_menu_popover') private popover!: HTMLIonPopoverElement;

  protected isOpen = signal(false);

  open(e: Event) {
    if (!this.popover) return;
    this.isOpen.set(false);
    setTimeout(() => {
      this.popover.event = e;
      this.isOpen.set(true);
    }, 0);
  }
}
