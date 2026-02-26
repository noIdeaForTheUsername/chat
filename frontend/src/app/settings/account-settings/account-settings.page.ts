import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonButton, IonContent, IonNote } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from '@app/shared/headers/standard-header-component/standard-header.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { AuthService } from '@src/app/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { LoadingIndicator } from "@src/app/loading/loading-indicator-component/loading-indicator.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.page.html',
  styleUrls: ['./account-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonNote,
    StandardHeaderComponent,
    TranslatePipe,
    LoadingIndicator
]
})
export class AccountSettingsPage implements OnInit {

  private alertService = inject(AlertService);
  protected translate = inject(TranslateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loading = signal(true);
  protected loadErr = signal<number | string | null>(null);


  ngOnInit(): void {
    this.loadAccount();

    this.disableFormIfCurrentPasswordEmpty();
    this.form.get('currentPassword')?.valueChanges.subscribe((value) => {
      this.disableFormIfCurrentPasswordEmpty();
    });
  }

  private async loadAccount() {
    try {
      const account = await firstValueFrom(this.authService.loadServerAuth());
      this.loading.set(false);
      this.fillWithExistingData({
        email: account.email,
        phoneNumber: account.phoneNumber
      })
    }
    catch (e: any) {
      this.loadErr.set(e.error?.message ?? e.status ?? 'data-unavailable');
    }
  }

  private disableFormIfCurrentPasswordEmpty() {
    const disableFields = !this.form.get("currentPassword")?.value;
    for (let controlName of Object.keys(this.form.controls)) {
      const control = this.form.get(controlName);
      if (control && controlName !== "currentPassword") {
        if (disableFields) control.disable({ emitEvent: false });
        else control.enable({ emitEvent: false });
      }
    }
  }


  protected form = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.email]),
    phoneNumber: new FormControl('+48 ', [Validators.pattern(/^[+][0-9 ]*$/)]),
    // passwords optional when both empty — validator enforces requirements/match conditionally
    password: new FormControl('', { nonNullable: true }),
    passwordRepeat: new FormControl('', { nonNullable: true }),
  }, { validators: passwordsMatchValidator });



  fillWithExistingData(data: Partial<{ email: string | null; phoneNumber: string | null; }>): void {
    this.form.patchValue({
      email: data.email ?? this.form.get('email')?.value,
      phoneNumber: data.phoneNumber ?? this.form.get('phoneNumber')?.value,
    }, { emitEvent: false });
  }

  editAccount(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant('error.data-invalid.description'),
      );
      return;
    }

    let body: Record<string, any> = this.form.getRawValue();
    if (body['phoneNumber']?.trim() === '+48') {
      body['phoneNumber'] = '';
    }

    // Remove empty fields from payload
    Object.keys(body).forEach((k) => {
      const v = body[k];
      if (v === '' || v === null || v === undefined) delete body[k];
    });

    // PERFORM
    this.authService.updateAccount(body).subscribe({
      next: () => {
        this.router.navigate(["/chats"]);
      }
    });
  }
}


function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const passwordCtrl = group.get('password');
  const repeatCtrl = group.get('passwordRepeat');
  if (!passwordCtrl || !repeatCtrl) return null;

  const password = (passwordCtrl.value ?? '').toString().trim();
  const repeat = (repeatCtrl.value ?? '').toString().trim();

  // Case A: both empty -> OK (clear password-related errors)
  if (password === '' && repeat === '') {
    const pwErr = { ...((passwordCtrl.errors as Record<string, any>) || {}) };
    delete pwErr['required'];
    delete pwErr['passwordMismatch'];
    passwordCtrl.setErrors(Object.keys(pwErr).length ? pwErr : null);

    const repErr = { ...((repeatCtrl.errors as Record<string, any>) || {}) };
    delete repErr['required'];
    delete repErr['passwordMismatch'];
    repeatCtrl.setErrors(Object.keys(repErr).length ? repErr : null);
    return null;
  }

  // Case B: at least one non-empty -> both must be non-empty and equal
  const pwErrors = { ...((passwordCtrl.errors as Record<string, any>) || {}) };
  const repErrors = { ...((repeatCtrl.errors as Record<string, any>) || {}) };

  // required if empty
  if (password === '') pwErrors['required'] = true; else delete pwErrors['required'];
  if (repeat === '') repErrors['required'] = true; else delete repErrors['required'];

  // mismatch if both non-empty and different
  if (password !== '' && repeat !== '' && password !== repeat) repErrors['passwordMismatch'] = true;
  else delete repErrors['passwordMismatch'];

  passwordCtrl.setErrors(Object.keys(pwErrors).length ? pwErrors : null);
  repeatCtrl.setErrors(Object.keys(repErrors).length ? repErrors : null);

  return null;
}
