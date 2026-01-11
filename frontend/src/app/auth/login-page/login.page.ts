import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, TranslatePipe,
    IonContent, RouterLink,
    StandardHeaderComponent,
    IonButton, IonButtons,
    LanguageButtonComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {

  protected authService = inject(AuthService);
  protected translate = inject(TranslateService);

  protected backButtonDefaultHref = computed(() => this.authService.getUserId() ? '/chats' : "/");
  // protected displayBackButton = computed(() => this.authService.getUserId() !== null);

  loginForm = new FormGroup({
    account: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });


  login() {
    const body = this.loginForm.getRawValue();
    this.authService.login(body);
  }

  ionViewWillLeave() {
    this.loginForm.patchValue({ account: '', password: '' });
    this.loginForm.reset();
  }
}
