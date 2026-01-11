import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { LanguageService } from '../language.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-language-button',
  templateUrl: './language-button.component.html',
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class LanguageButtonComponent {

  // component created mainly for toolbars, for language toggling at the start pages outside of the main app

  private langService = inject(LanguageService);

  toggleLanguage(): void {
    this.langService.toggleLanguage();
  }
}