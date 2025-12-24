import { inject, Injectable, signal } from '@angular/core';
import { AlertType } from '../alert-type.enum';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private translate = inject(TranslateService);

  private readonly _open = signal(false);
  public readonly open = this._open.asReadonly();

  type = signal<AlertType>(AlertType.INFO);
  header = signal<string>("Alert");
  subheader = signal<string | undefined>(undefined);
  message = signal<string | undefined>(undefined);
  confirmHandler = signal<Function>(() => {});  // note: OK button also uses the confirm handler
  cancelHandler = signal<Function>(() => {});

  setAlertDismissed() {
    this._open.set(false);
    this.reset();
  }

  private reset() {
    this.type.set(AlertType.INFO);
    this.header.set("Alert");
    this.subheader.set(undefined);
    this.message.set(undefined);
    this.confirmHandler.set(() => {});
    this.cancelHandler.set(() => {});
  }

  // ------------------------- MAIN ALERT FUNCTIONS -------------------------

  displayMessageAlert(type: AlertType.INFO | AlertType.ERROR, message: string,
    handler?: Function, header?: string, subheader?: string) {
    this.type.set(type);
    this.header.set(header || "Alert");
    this.subheader.set(subheader);
    this.message.set(message);
    if (handler) this.confirmHandler.set(handler);

    this._open.set(true);
  }

  displayPromptAlert(type: AlertType.PROMPT | AlertType.DANGER_PROMPT, message?: string,
    confimHandler?: Function, cancelHandler?: Function, header?: string, subheader?: string) {
    this.type.set(type);
    this.header.set(header || "Alert");
    this.subheader.set(subheader);
    this.message.set(message);
    if (confimHandler) this.confirmHandler.set(confimHandler);
    if (cancelHandler) this.cancelHandler.set(cancelHandler);

    this._open.set(true);
  }

  // ------------------------- ALERT UTIL FUNCTIONS -------------------------
  displayBlockConfirm(userId: number) {
    this.displayPromptAlert(AlertType.DANGER_PROMPT, this.translate.instant("prompt.block.user"),
    () => console.log(`The user ID=${userId} will be blocked!`), undefined,
    this.translate.instant("profile.block"), this.translate.instant("common.are-you-sure"));
  }
}
