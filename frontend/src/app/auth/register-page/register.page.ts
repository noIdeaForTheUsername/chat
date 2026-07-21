import { Component, computed, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { AuthService } from '@app/auth/auth.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { IonButton, IonButtons, IonContent } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { PasswordStrengthComponent } from "../password-strength/password-strength.component";
import { passwordsValidator, phoneNumberRegex } from '@src/app/shared/inputs/form-utils';



@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink, ReactiveFormsModule,
    TranslatePipe, IonButton, StandardHeaderComponent, IonButtons, LanguageButtonComponent, PasswordStrengthComponent]
})
export class RegisterPage {

  protected auth = inject(AuthService);
  private alertService = inject(AlertService);
  protected translate = inject(TranslateService);

  protected backButtonDefaultHref = computed(() => this.auth.getUserId() ? '/chats' : "/");

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phoneNumber: new FormControl('+48 ', { nonNullable: true, validators: [Validators.required, Validators.pattern(phoneNumberRegex)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    passwordRepeat: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    bio: new FormControl(''),
  }, { validators: [passwordsValidator] });


  ngOnInit() {
    this.restoreDraftFromStorage();
    this.form.valueChanges.subscribe(value => {
      const { password, passwordRepeat, ...rest } = value as any;
      try {
        localStorage.setItem('registerFormDraft', JSON.stringify(rest));
      } catch {
        // ignore storage errors (e.g. private mode)
      }
    });
  }

  
  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.displayMessageAlert(AlertType.ERROR, this.translate.instant('error.data-invalid.description'));
      return;
    }
    const body = this.form.getRawValue();
    if (body.phoneNumber?.trim() === '+48') {  // erase if it was at the default prefix value
      body.phoneNumber = '';
    }
    this.auth.register(body).subscribe({
      next: () => {
        this.form.reset();
        localStorage.removeItem('registerFormDraft');
      }
    });
  }

  ionViewWillLeave() {
    this.form.patchValue({ password: '', passwordRepeat: '' });
  }

  private restoreDraftFromStorage(): void {
    try {
      const raw = localStorage.getItem('registerFormDraft');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        name: string | null;
        phoneNumber: string | null;
        bio: string | null;
      }>;

      this.form.patchValue({
        name: parsed.name ?? this.form.get('name')?.value,
        phoneNumber: parsed.phoneNumber ?? this.form.get('phoneNumber')?.value,
        bio: parsed.bio ?? this.form.get('bio')?.value,
      }, { emitEvent: false });
    } catch {
      // ignore malformed JSON / storage errors
    }
  }
}
