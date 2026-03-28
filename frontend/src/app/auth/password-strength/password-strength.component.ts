import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { REQUIRED_PASSWORD_LENGTH } from '@src/app/shared/inputs/form-utils';

@Component({
  selector: 'app-password-strength',
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss'],
  imports: [TranslatePipe]
})
export class PasswordStrengthComponent{

  password = input<string>('');
  passwordRepeat = input<string>('');

  protected requiredLength = REQUIRED_PASSWORD_LENGTH;

  protected lengthValid = computed(() => this.password().length >= this.requiredLength);
  protected caseValid = computed(() => /[a-z]/.test(this.password()) && /[A-Z]/.test(this.password()));
  protected specialCharValid = computed(() => /[\d\p{P}\p{S}]/u.test(this.password()));
  protected matchValid = computed(() => this.password().length > 0 && this.password() === this.passwordRepeat());

}
