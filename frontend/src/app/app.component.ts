import { Component } from '@angular/core';
import translationsEN from "@assets/i18n/en.json";
import translationsPL from "@assets/i18n/pl.json";
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';

import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBack,
  arrowDown, arrowRedo,
  attach,
  ban, build,
  chatbubbleEllipses, checkboxOutline,
  chevronForward,
  closeCircle, copy,
  document,
  download, ellipse, ellipsisHorizontal,
  ellipsisHorizontalCircle,
  flame,
  globe,
  handLeft,
  help, helpCircle, hourglass,
  images,
  language,
  logoAndroid, logOut, notifications, paperPlane, pencil, people, person, personAdd, personRemove,
  settings, trash, trashBin, wifiOutline
} from 'ionicons/icons';
import { AlertWindowComponent } from "./alerts/alert-window/alert-window.component";
import { LanguageService } from './i18n/language.service';
import { ClosingPreventionComponent } from "./shared/closing-prevention/closing-prevention.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AlertWindowComponent, ClosingPreventionComponent],
})
export class AppComponent {
  constructor(private translate: TranslateService, private languageService: LanguageService) {
    addIcons({ paperPlane, arrowDown, alertCircleOutline, wifiOutline, helpCircle, ban,
      chatbubbleEllipses, pencil, help, settings, ellipsisHorizontal, arrowRedo, 
      ellipsisHorizontalCircle, closeCircle, checkboxOutline, trash, trashBin,
      people, notifications, download, person, personAdd, personRemove, attach, document,
      build, logOut, language, copy, ellipse, flame, handLeft, hourglass, logoAndroid, globe, arrowBack,
      images, chevronForward });

    translate.setTranslation('pl', translationsPL);
    translate.setTranslation('en', translationsEN);
    translate.setFallbackLang('en');
  }
}
