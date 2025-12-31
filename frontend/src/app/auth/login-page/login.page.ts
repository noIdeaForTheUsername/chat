import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonButton } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, TranslatePipe,
    IonContent, RouterLink,
    StandardHeaderComponent,
    IonButton
],
})
export class LoginPage {

  protected auth = inject(AuthService);
  protected translate = inject(TranslateService);

  loginForm = new FormGroup({
    account: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });


  login() {
    const body = this.loginForm.getRawValue();
    this.auth.login(body);
  }
}
