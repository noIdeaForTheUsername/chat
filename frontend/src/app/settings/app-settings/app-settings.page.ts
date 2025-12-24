import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItemGroup, IonItemDivider, IonLabel, IonSelectOption } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { StandardHeaderComponent } from "@app/shared/headers/standard-header-component/standard-header.component";
import { ItemButtonComponent } from "@app/shared/inputs/item-button-component/item-button.component";
import { ItemSelectComponent } from "../../shared/inputs/item-select-component/item-select.component";
import { ItemToggleComponent } from "@app/shared/inputs/item-toggle-component/item-toggle.component";
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonItemGroup, IonItemDivider, IonLabel, IonSelectOption,
    CommonModule, FormsModule, RouterLink, TranslatePipe, StandardHeaderComponent, ItemButtonComponent, ItemSelectComponent, ItemToggleComponent]
})
export class AppSettingsPage implements OnInit {

  protected profileService = inject(ProfileService);

  constructor() { }

  ngOnInit() {
  }

}
