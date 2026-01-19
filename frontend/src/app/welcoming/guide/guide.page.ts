import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButtons } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.page.html',
  styleUrls: ['./guide.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, StandardHeaderComponent, LanguageButtonComponent, IonButtons, TranslatePipe]
})
export class GuidePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
