import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from "@ionic/angular/standalone"
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-selection-toolbar',
  templateUrl: './selection-toolbar.component.html',
  styleUrls: ['./selection-toolbar.component.scss'],
  imports: [IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SelectionToolbarComponent {

  leaveSelectionMode = output<void>();
  openActionMenu = output<void>();

}
