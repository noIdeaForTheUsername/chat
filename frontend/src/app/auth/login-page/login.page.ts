import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';
import { LanguageService } from '@app/i18n/language.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, TranslatePipe,
    IonContent, RouterLink,
    StandardHeaderComponent,
    IonButton, IonButtons, IonIcon
],
})
export class LoginPage {

  protected authService = inject(AuthService);
  protected translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  protected displayBackButton = computed(() => this.authService.getUserId() !== null);

  loginForm = new FormGroup({
    account: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });


  login() {
    const body = this.loginForm.getRawValue();
    this.authService.login(body);
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  ionViewWillLeave() {
    this.loginForm.patchValue({ account: '', password: '' });
    this.loginForm.reset();
  }
}
