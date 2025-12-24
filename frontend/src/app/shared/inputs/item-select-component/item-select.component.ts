import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import { IonItem, IonSelect, IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-item-select',
  templateUrl: './item-select.component.html',
  styleUrls: ['./item-select.component.scss'],
  imports: [IonItem, IonSelect, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ItemSelectComponent {

  text = input<string>("Select");
  icon = input<string | undefined>();

}
