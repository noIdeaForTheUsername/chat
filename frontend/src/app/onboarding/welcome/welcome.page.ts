import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { AppInitService } from '@src/app/loading/app-init.service';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { PreloadingScreenComponent } from "@src/app/loading/preloading-screen/preloading-screen.component";
import { isAndroid, isPwa } from '@src/app/shared/platform-detection/platformUtils';
import { Capacitor } from '@capacitor/core';
import { AndroidInstallationComponent } from "../android-installation-component/android-installation.component";


@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, StandardHeaderComponent, IonButtons, IonButton, LanguageButtonComponent,
    TranslatePipe, RouterLink, PreloadingScreenComponent, AndroidInstallationComponent]
})
export class WelcomePage implements OnInit {
  private appInitService = inject(AppInitService);
  protected readonly preloading = this.appInitService.preloading;

  protected showAndroidDownload = signal(false);

  ngOnInit() {
    if (isAndroid() && !isPwa() && !Capacitor.isNativePlatform()) {
      this.showAndroidDownload.set(true);
    }
  }
}
