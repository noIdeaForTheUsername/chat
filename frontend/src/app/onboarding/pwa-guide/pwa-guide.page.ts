import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { TranslatePipe } from '@ngx-translate/core';
import { isIOS, isAndroid } from '@src/app/shared/platform-detection/platformUtils';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-guide',
  templateUrl: './pwa-guide.page.html',
  styleUrls: ['./pwa-guide.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, StandardHeaderComponent, LanguageButtonComponent, IonButtons, TranslatePipe, IonIcon, RouterLink]
})
export class GuidePage implements OnInit {

  protected isIos = signal(false);
  protected isAndroid = signal(false);

  ngOnInit() {
    this.isIos.set(isIOS());
    this.isAndroid.set(isAndroid());
  }

}
