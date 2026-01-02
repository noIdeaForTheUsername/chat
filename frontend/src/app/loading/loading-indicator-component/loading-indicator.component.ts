import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { LoadingStatus } from '@app/loading/loading-status.interface';
import { IonSpinner, IonButton } from '@ionic/angular/standalone';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { errorIconMap } from './error-icon-map';


@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss'],
  imports: [IonSpinner, IonIcon, IonButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicator {

  // Dependencies
  private translateService = inject(TranslateService);

  // Appearance
  type = input<string>('crescent');
  color = input<string>('medium');
  size = input<'large' | 'medium' | 'full'>('full');  // full will fill the entire parent container

  // State
  active = input<boolean>(true);
  errorId = input<string | null>(null);

  protected errorIconName = computed(() => {
    if (this.errorId() !== null) {
      let iconName = errorIconMap.get(this.errorId()!);
      if (iconName !== undefined) return iconName;
    }
    return "alert-circle-outline";
  });

  
  protected errorMessageKey = computed(() => {  // Set the proper error message key
    if (this.errorId() !== null) {
      let key = `error.${this.errorId()}.header`;
      if (this.checkTranslationKeyExists(key)) return `error.${this.errorId()}`;
    }
    return "";
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
