import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonHeader, IonButtons, IonBackButton, IonToolbar, IonTitle  } from '@ionic/angular/standalone';

@Component({
  selector: 'app-standard-header',
  templateUrl: './standard-header.component.html',
  styleUrls: ['./standard-header.component.scss'],
  imports: [IonHeader, IonButtons, IonBackButton, IonToolbar, IonTitle],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandardHeaderComponent {
  title = input.required<string>();
  backButton = input<boolean>(true);
}
