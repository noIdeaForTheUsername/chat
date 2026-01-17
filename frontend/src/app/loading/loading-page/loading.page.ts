import { Component, inject } from "@angular/core";
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe } from "@ngx-translate/core";
import { IonButton, IonButtons, IonContent, IonIcon } from "@ionic/angular/standalone";
import { LoadingIndicator } from "../loading-indicator-component/loading-indicator.component";
import { AuthService } from "@app/auth/auth.service";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { AppInitService } from "@src/app/initialization/app-init.service";

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading.page.html',
  standalone: true,
  imports: [StandardHeaderComponent, TranslatePipe, IonContent, LoadingIndicator, IonButtons, LanguageButtonComponent],
})
export class LoadingPage {

  // NOTE: AUTH SERVICE IS THE FILE THAT NAVIGATES THE USER FURTHER FROM THIS LOADING PAGE

  private initService = inject(AppInitService);
  protected serverUnavailableWhileLoggedOut = this.initService.serverUnavailableWhileLoggedOut;
}