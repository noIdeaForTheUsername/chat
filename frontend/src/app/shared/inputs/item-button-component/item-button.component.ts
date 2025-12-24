import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-item-button',
  templateUrl: './item-button.component.html',
  styleUrls: ['./item-button.component.scss'],
  imports: [IonItem, IonIcon, IonLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ItemButtonComponent{

  icon = input<string>();
  iconColor = input<string>();
  text = input.required<string>();

}
