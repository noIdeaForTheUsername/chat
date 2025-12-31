import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { IonSpinner, IonButton } from '@ionic/angular/standalone';
import { IonIcon } from '@ionic/angular/standalone';
import { LoadingService } from '../loading-service/loading.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss'],
  imports: [IonSpinner, IonIcon, IonButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicator {

  // Services
  private loadingService = inject(LoadingService);
  private translateService = inject(TranslateService);

  // Appearance
  type = input<string>('crescent');
  color = input<string>('medium');
  size = input<'large' | 'medium'>('large');

  // Error handling options
  public handleErrors = input<boolean>(true);

  // Error signals
  protected errorId = this.loadingService.errorId;  // this also enables handling of the no connection error
  // errorMessage = this.loadingService.errorMessage;
  protected errorIconName = this.loadingService.errorIconName;

  // Internal
  protected displaySpinner = computed(() => (this.errorId() === null)/*still loading*/  || !this.handleErrors()/*not handling errors at all*/);

  
  protected errorMessageKey = computed(() => {  // Set the proper error message key
    if (this.errorId() !== null) {
      let key = `error.${this.errorId()}.header`;
      if (this.checkTranslationKeyExists(key)) return `error.${this.errorId()}`;
    }
    return "error.unknown";  // Unknown error (translation key not found)
  });

  private checkTranslationKeyExists(key: string | null): boolean {
    if (key === null) return false;
    let foundValue = this.translateService.instant(key);
    return foundValue != key;
  }

  protected reloadPage() {
    window.location.reload();
  }

  constructor() {}

}
