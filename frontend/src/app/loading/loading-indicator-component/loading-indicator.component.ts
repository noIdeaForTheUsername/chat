import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { IonSpinner, IonButton } from '@ionic/angular/standalone';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { errorIconMap } from '@app/shared/errors/error-utils';
import { getErrorMessageKey, httpCodeMap } from '@app/shared/errors/error-utils';


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
  errorId = input<string | null | number>(null);

  protected errorMessageKey = computed(() => getErrorMessageKey(this.errorId(), this.translateService));

  protected errorIconName = computed(() => {
    const key = this.errorMessageKey().slice(6);  // Remove "error." prefix
    if (key !== null) {
      let iconName = errorIconMap.get(key);
      if (iconName !== undefined) return iconName;
    }
    return "alert-circle-outline";
  });

  protected reloadPage() {
    window.location.reload();
  }

  constructor() {}

}
