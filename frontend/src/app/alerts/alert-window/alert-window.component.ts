import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { IonAlert } from "@ionic/angular/standalone"
import { AlertService } from '../alert-service/alert.service';
import { AlertType } from '../alert-type.enum';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-alert-window',
  templateUrl: './alert-window.component.html',
  styleUrls: ['./alert-window.component.scss'],
  imports: [IonAlert],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertWindowComponent {

  protected alertService = inject(AlertService);
  private translate = inject(TranslateService);

  type = this.alertService.type;

  protected buttons = computed(() => this.getButtons(this.type()));

  constructor() { }

  onDismiss() {
    this.alertService.setAlertDismissed();
  }

  // ---------------------- BUTTONS CONFIGURATION ----------------------

  private getButtons(type: AlertType): object[] {
    switch (type) {
      default:
      case AlertType.INFO:
        return this.infoButtons;
      case AlertType.PROMPT:
        return this.promptButtons
      case AlertType.DANGER_PROMPT:
        return this.dangerPromptButtons
      case AlertType.ERROR:
        return this.errorButtons
    }
  }

  private okButton = {
    text: this.translate.instant("common.ok"),
    role: "confirm",
    handler: () => this.alertService.confirmHandler()()
  }
  private confirmButton = {
    text: this.translate.instant("common.confirm"),
    role: "confirm",
    handler: () => this.alertService.confirmHandler()()
  }
  private cancelButton = {
    text: this.translate.instant("common.cancel"),
    role: "cancel",
    handler: () => this.alertService.cancelHandler()()
  }

  protected infoButtons = [this.okButton];
  protected promptButtons = [this.cancelButton, this.confirmButton];
  protected dangerPromptButtons = [this.cancelButton, {...this.confirmButton, cssClass: "danger"}];
  protected errorButtons = [this.okButton];
}
