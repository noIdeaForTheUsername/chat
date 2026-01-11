import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import translationsEN from "@assets/i18n/en.json";
import translationsPL from "@assets/i18n/pl.json";

import { addIcons } from 'ionicons';
import { add, alertCircleOutline, arrowDown, arrowRedo, attach, ban, build, call, chatbubbleEllipses, checkboxOutline, closeCircle, copy, download, ellipse, ellipsisHorizontal,
  ellipsisHorizontalCircle,
  flame,
  handLeft,
  help, helpCircle, hourglass, images, key, language, lockClosed, logOut, notifications, paperPlane, pencil, people, person, personAdd, personRemove, search, settings, trash, trashBin, wifiOutline } from 'ionicons/icons';
import { AlertWindowComponent } from "./alerts/alert-window/alert-window.component";
import { LanguageService } from './i18n/language.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AlertWindowComponent],
})
export class AppComponent {
  constructor(private translate: TranslateService, private languageService: LanguageService) {
    addIcons({ add, paperPlane, attach, arrowDown, alertCircleOutline, wifiOutline, helpCircle, ban,
      lockClosed, chatbubbleEllipses, pencil, key, help, settings, ellipsisHorizontal, arrowRedo, 
      ellipsisHorizontalCircle, closeCircle, checkboxOutline, trash, trashBin,
      call, search, images, people, notifications, download, person, personAdd, personRemove,
      build, logOut, language, copy, ellipse, flame, handLeft, hourglass });

    translate.setTranslation('pl', translationsPL);
    translate.setTranslation('en', translationsEN);
    translate.setFallbackLang('en');
  }
}
