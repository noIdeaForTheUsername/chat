import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonItem, IonIcon, IonToggle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-item-toggle',
  templateUrl: './item-toggle.component.html',
  styleUrls: ['./item-toggle.component.scss'],
  imports: [IonItem, IonIcon, IonToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ItemToggleComponent {

  text = input.required<string>();
  icon = input<string | undefined>(undefined);
  checked = input<boolean>(false);
}
