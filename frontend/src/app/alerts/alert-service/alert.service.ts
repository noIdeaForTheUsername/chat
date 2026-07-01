import { inject, Injectable, signal } from '@angular/core';
import { AlertType } from '../alert-type.enum';
import { TranslateService } from '@ngx-translate/core';
import { getErrorMessageKey } from '@app/shared/errors/error-utils';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private translate = inject(TranslateService);
  private router = inject(Router);

  private readonly _open = signal(false);
  public readonly open = this._open.asReadonly();

  type = signal<AlertType>(AlertType.INFO);
  header = signal<string>("Alert");
  subheader = signal<string | undefined>(undefined);
  message = signal<string | undefined>(undefined);
  confirmHandler = signal<Function>(() => {});  // note: OK button also uses the confirm handler
  cancelHandler = signal<Function>(() => {});

  // internal (prevent spamming particular types of alerts)
  private serverConnectionErrorDisplayed = false;

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

  private getDefaultHeader(type: AlertType): string {
    switch (type) {
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
    this.header.set(header || this.getDefaultHeader(type));
    this.subheader.set(subheader);
    this.message.set(message);
    if (handler) this.confirmHandler.set(handler);

    this._open.set(true);
  }

  displayPromptAlert(type: AlertType.PROMPT | AlertType.DANGER_PROMPT, message?: string,
    confimHandler?: Function, cancelHandler?: Function, header?: string, subheader?: string) {
    this.type.set(type);
    this.header.set(header || this.getDefaultHeader(type));
    this.subheader.set(subheader);
    this.message.set(message);
    if (confimHandler) this.confirmHandler.set(confimHandler);
    if (cancelHandler) this.cancelHandler.set(cancelHandler);

    this._open.set(true);
  }

  // ------------------------- ALERT UTIL FUNCTIONS -------------------------
  
  displayError(errorId: string | number, confirmHandler?: Function, customSubheader?: string) {
    const key = getErrorMessageKey(errorId, this.translate);
    const header = this.translate.instant(`${key}.header`);
    const message = this.translate.instant(`${key}.description`);
    this.displayMessageAlert(AlertType.ERROR, message, confirmHandler, header, customSubheader);
  }

  displayUnknownError(error?: any) {
    const header = this.translate.instant(`error.unknown.header`);
    const message = this.translate.instant(`error.unknown.description`);
    this.displayMessageAlert(AlertType.ERROR,
      message + (error ? `\n\n${JSON.stringify(error)}` : ""),
      undefined, header);
  }

  displayServerConnectionError(always = false) {  // "always" ignores the limit (for directly user-initiated actions, e.g. login)
    if (this.router.url === '/') return; // loading page has an entire screen for error message
    if (this.serverConnectionErrorDisplayed && !always) return;
    this.serverConnectionErrorDisplayed = true;

    if (navigator.onLine) {
      this.displayMessageAlert(AlertType.ERROR, this.translate.instant('error.server-unavailable.description'),
      () => {}, this.translate.instant("error.server-unavailable.header"));
    }
    else {
      this.displayMessageAlert(AlertType.ERROR, this.translate.instant('error.no-internet.description'),
      () => {}, this.translate.instant("error.no-internet.header"));
    }
  }
}
