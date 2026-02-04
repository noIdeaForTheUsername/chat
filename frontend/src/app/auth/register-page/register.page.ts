import { Component, computed, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { AuthService } from '@app/auth/auth.service';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { IonButton, IonButtons, IonContent, IonToggle } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";


function loginValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null | undefined;
  if (value == null) return null;
  const normalized = value.replace(/[^\p{L}\p{N}_]/gu, '');
  return normalized === value ? null : { normalizedRemoval: true };
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const passwordCtrl = group.get('password');
  const repeatCtrl = group.get('passwordRepeat');
  if (!passwordCtrl || !repeatCtrl) return null;

  const password = passwordCtrl.value;
  const repeat = repeatCtrl.value;
  const mismatch = !!password && !!repeat && password !== repeat;

  const existingErrors = repeatCtrl.errors || {};
  if (mismatch) {
    if (!existingErrors['passwordMismatch']) {
      repeatCtrl.setErrors({ ...existingErrors, passwordMismatch: true });
    }
  } else {
    if (existingErrors['passwordMismatch']) {
      const { passwordMismatch, ...rest } = existingErrors as Record<string, any>;
      repeatCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
  return null;
}


@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink, ReactiveFormsModule,
    TranslatePipe, IonButton, StandardHeaderComponent, IonButtons, LanguageButtonComponent]
})
export class RegisterPage {

  protected auth = inject(AuthService);
  private alertService = inject(AlertService);
  protected translate = inject(TranslateService);

  protected backButtonDefaultHref = computed(() => this.auth.getUserId() ? '/chats' : "/");

  form = new FormGroup({
    name: new FormControl(''),
    login: new FormControl('', { nonNullable: true, validators: [Validators.required, loginValidator] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    passwordRepeat: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', [Validators.email]),
    phoneNumber: new FormControl('+48 ', [Validators.pattern(/^\+[0-9 ]+$/)]),
    bio: new FormControl(''),
    // emailPublic: new FormControl<boolean>(true, { nonNullable: true }),
    // phoneNumberPublic: new FormControl<boolean>(true, { nonNullable: true }),
  }, { validators: passwordsMatchValidator });


  ngOnInit() {
    // Auto-complete login based on the entered name, if the login field is untouched
    const nameCtrl = this.form.get('name');
    const loginCtrl = this.form.get('login');
    nameCtrl?.valueChanges.subscribe((name) => {
      if (!loginCtrl) return;
      if (loginCtrl.touched) return;
      const auto = this.deriveLoginFromName(name ?? '');
      loginCtrl.patchValue(auto, { emitEvent: false });
    });

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

  private deriveLoginFromName(name: string): string {
    return (name || '').toLowerCase().replace(/[^\p{L}]/gu, '');
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
        login: string | null;
        email: string | null;
        phoneNumber: string | null;
        bio: string | null;
        // emailPublic: boolean | null;
        // phoneNumberPublic: boolean | null;
      }>;

      this.form.patchValue({
        name: parsed.name ?? this.form.get('name')?.value,
        login: parsed.login ?? this.form.get('login')?.value,
        email: parsed.email ?? this.form.get('email')?.value,
        phoneNumber: parsed.phoneNumber ?? this.form.get('phoneNumber')?.value,
        bio: parsed.bio ?? this.form.get('bio')?.value,
        // emailPublic: parsed.emailPublic ?? this.form.get('emailPublic')?.value,
        // phoneNumberPublic: parsed.phoneNumberPublic ?? this.form.get('phoneNumberPublic')?.value,
      }, { emitEvent: false });
    } catch {
      // ignore malformed JSON / storage errors
    }
  }
}
