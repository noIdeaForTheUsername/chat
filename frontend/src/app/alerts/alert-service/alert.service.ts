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

  private getDefaultHeader(): string {
    switch (this.type()) {
      case AlertType.INFO:
        return this.translate.instant("common.info");
      case AlertType.PROMPT: 
      case AlertType.DANGER_PROMPT:
        return this.translate.instant("common.are-you-sure");
      case AlertType.ERROR:
        return this.translate.instant("common.error");
      default:
        return this.translate.instant("common.alert");
    }
      
  }

  // ------------------------- MAIN ALERT FUNCTIONS -------------------------

  displayMessageAlert(type: AlertType.INFO | AlertType.ERROR, message: string,
    handler?: Function, header?: string, subheader?: string) {
    this.type.set(type);
    this.header.set(header || this.getDefaultHeader());
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

  displayErrorById(errorId: string, confirmHandler?: Function) {
    const header = this.translate.instant(`error.${errorId}.header`);
    const message = this.translate.instant(`error.${errorId}.description`);
    this.displayMessageAlert(AlertType.ERROR, message, confirmHandler, header);
  }

  displayUnknownError(error?: any) {
    const header = this.translate.instant(`error.unknown.header`);
    const message = this.translate.instant(`error.unknown.description`);
    this.displayMessageAlert(AlertType.ERROR,
      message + (error ? `\n\n${JSON.stringify(error)}` : ""),
      undefined, header);
  }

  displayServerConnectionError() {
    this.displayMessageAlert(AlertType.ERROR, this.translate.instant('error.0.description'),
      () => {}, this.translate.instant("error.0.header"));
  }
}
