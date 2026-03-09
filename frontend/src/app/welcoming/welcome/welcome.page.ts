import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButtons, IonButton } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, StandardHeaderComponent, IonButtons, IonButton, LanguageButtonComponent, TranslatePipe, RouterLink]
})
export class WelcomePage {

  // private authService = inject(AuthService);
  // private router = inject(Router);

  // ionViewWillEnter() {
  //   if (this.authService.getUserId() != null) {
  //     this.router.navigateByUrl('/');
  //   }
  // }

  
}
