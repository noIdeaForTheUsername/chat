import { Component, inject } from "@angular/core";
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { IonButtons, IonContent } from "@ionic/angular/standalone";
import { TranslatePipe } from "@ngx-translate/core";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { AppInitService } from "@src/app/loading/app-init.service";
import { LoadingIndicator } from "../loading-indicator-component/loading-indicator.component";

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading.page.html',
  standalone: true,
  imports: [StandardHeaderComponent, TranslatePipe, IonContent, LoadingIndicator, IonButtons, LanguageButtonComponent],
})
export class LoadingPage {

  // NOTE: APP INIT SERVICE IS THE FILE THAT NAVIGATES THE USER FURTHER FROM THIS LOADING PAGE

  private initService = inject(AppInitService);
  protected serverUnavailableWhileLoggedOut = this.initService.serverUnavailableWhileLoggedOut;
}