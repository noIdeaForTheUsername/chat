import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonToggle } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';

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
  imports: [IonContent, IonToggle, RouterLink, ReactiveFormsModule,
    TranslatePipe, IonButton, StandardHeaderComponent]
})
export class RegisterPage {

  protected auth = inject(AuthService);
  private alertService = inject(AlertService);
  protected translate = inject(TranslateService);

  form = new FormGroup({
    name: new FormControl(''),
    login: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    passwordRepeat: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', [Validators.email]),
    phoneNumber: new FormControl('', [Validators.pattern(/^\+[0-9 ]+$/)]),
    bio: new FormControl(''),
    emailPublic: new FormControl<boolean>(true, { nonNullable: true }),
    phoneNumberPublic: new FormControl<boolean>(true, { nonNullable: true }),
  }, { validators: passwordsMatchValidator });


  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.displayMessageAlert(AlertType.ERROR, this.translate.instant('common.form-invalid'));
      return;
    }
    const body = this.form.getRawValue();
    this.auth.register(body);
  }

  ionViewWillLeave() {
    this.form.patchValue({ password: '', passwordRepeat: '' });
  }
}
