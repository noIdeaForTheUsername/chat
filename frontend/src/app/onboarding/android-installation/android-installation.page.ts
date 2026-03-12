import { Component, OnInit, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { StandardHeaderComponent } from '@src/app/shared/headers/standard-header-component/standard-header.component';
import { AndroidInstallationComponent } from "../android-installation-component/android-installation.component";
import { isAndroid, isPwa } from '@src/app/shared/platform-detection/platformUtils';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-android-installation-page',
  templateUrl: './android-installation.page.html',
  styleUrls: ['./android-installation.page.scss'],
  standalone: true,
  imports: [IonContent, TranslatePipe, StandardHeaderComponent, AndroidInstallationComponent, IonIcon, RouterLink]
})
export class AndroidInstallationPage implements OnInit {

  isAndroid = false;
  isPwa = false;

  ngOnInit() {
    this.isAndroid = isAndroid();
    this.isPwa = isPwa();
  }
}
