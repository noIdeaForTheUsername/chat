import { Component, computed, inject, input, output } from '@angular/core';
import { AlertService } from '@app/alerts/alert-service/alert.service';
import { AlertType } from '@app/alerts/alert-type.enum';
import { IonItem, IonLabel, IonInput, IonIcon } from "@ionic/angular/standalone";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'profile-info-item',
  templateUrl: './profile-info-item.component.html',
  styleUrls: ['./profile-info-item.component.scss'],
  imports: [IonItem, IonLabel, IonInput, TranslatePipe, IonIcon]
})
export class ProfileInfoItemComponent {

  title = input.required<string>();
  value = input<string | undefined>();
  editable = input<boolean>(false);
  type = input<string>("")

  valueChange = output<string>();

  infoBox = input(false);
  infoBoxContent = input("");

  protected valueDisplay = computed(() => this.value() === undefined ? this.translate.instant("page.profile-details.unset") : this.value());
  protected hidden = computed(() => (this.value() === undefined || this.value() === "") && !this.editable());

  private translate = inject(TranslateService);
  private alertService = inject(AlertService);

  protected onValueChange(newValue: string | number | null | undefined) {
    if (typeof newValue === "number")
      newValue = newValue.toString();
    this.valueChange.emit(newValue || "");
  }

  protected displayInfoBox() {
    this.alertService.displayMessageAlert(AlertType.INFO, this.infoBoxContent(), undefined, this.title(), undefined);
  }
}
