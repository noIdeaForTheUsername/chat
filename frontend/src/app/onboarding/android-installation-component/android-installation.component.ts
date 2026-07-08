import { Component } from '@angular/core';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { TranslatePipe } from '@ngx-translate/core';
import { Capacitor } from "@capacitor/core";

@Component({
  selector: 'app-android-installation',
  templateUrl: './android-installation.component.html',
  styleUrls: ['./android-installation.component.scss'],
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class AndroidInstallationComponent {

  protected readonly isAndroid = Capacitor.getPlatform() === 'android';
}
