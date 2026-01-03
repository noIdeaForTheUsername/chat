import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { AlertType } from "@app/alerts/alert-type.enum";
import { TranslateService } from "@ngx-translate/core";
import { AuthBackendApi, RegisterBody } from "./auth-api";


// Manages the user authenthication state, handles redirects and errors.
// This service also REDIRECTS FROM THE STARTER LOADING PAGE:
// "loadAuth", "handleGetAuthError", "navigateIfOnLoadingPage"


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private translate = inject(TranslateService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);
  private api = new AuthBackendApi(this.http);
  private router = inject(Router);

  private userId: number | null = null;
  public readonly processing = signal(false);

  public readonly serverUnavailableWhileLoggedOut = signal(false);

  constructor() {
    this.userId = Number(localStorage.getItem("userId")) || null;
    this.loadAuth();
  }

  private setUserId(id: number | null) {
    this.userId = id;
    if (id === null) localStorage.removeItem("userId");
    else localStorage.setItem("userId", id.toString());
  }

  public getUserId(): number | null {
    return this.userId;
  }

  public getUserIdOrError(): number {
    if (this.userId === null) {
      throw new Error("AuthService.getUserIdOrError: User ID null");
    }
    return this.userId;
  }


  // check if the user is logged in and redirect / handle error accordingly
  loadAuth() {
    this.api.getMe().subscribe({
      next: (res) => {
        this.processing.set(false);
        if (!res.id) {  // hopefully never happens
          this.alertService.displayErrorById('unknown');
          throw new Error("Successful response but server didn't return the user ID.");
        }

        this.setUserId(res.id);
        this.navigateIfOnOutsidePage('/chats');
      },
      error: (e) => this.handleGetAuthError(e)
    });
  }
  
  // LOGIN & REGISTER

  login(body: { account: string; password: string }) {
    this.processing.set(true);
    this.api.login(body).subscribe({
      next: (res: any) => {
        if (res.id)
          this.setUserId(res.id);
        else
          this.loadAuth();

        this.processing.set(false);
        window.location.replace("chats");
      },
      error: (err) => this.handleRegisterError(err)
    });
  }

  register(body: RegisterBody) {
    this.processing.set(true);

    if (body.email?.length === 0) 
      body.email = undefined;
    if (body.phoneNumber?.length === 0)
      body.phoneNumber = undefined;
    if (body.bio?.length === 0)
      body.bio = undefined;
    if (body.name?.length === 0)
      body.name = undefined;

    this.api.register(body).subscribe({
      next: (res: null) => {
        this.processing.set(false);
        try {
          localStorage.removeItem('registerFormDraft');
        } catch {
          // ignore storage errors
        }
        this.loadAuth();
      },
      error: (err) => this.handleRegisterError(err)
    });
  }


  // LOGOUT
  logout() {
    this.api.logout().subscribe({
      next: () => {
        this.setUserId(null);
        window.location.replace("login");
      },
      error: () => {
        this.alertService.displayErrorById('logout-failed');
      }
    });
  }



  // ERROR HANDLING

  private handleGetAuthError(err: any) {
    this.processing.set(false);

    // Don't block the start of the app if the user was logged in before (session expired, server down, etc)
    // User was logged in before:
    if (err.status === 0 && this.userId !== null) {  // server down
      this.navigateIfOnOutsidePage('/chats');
      this.alertService.displayServerConnectionError();
    }
    else if (err.status === 401 && this.userId !== null) {  // session expired
      this.navigateIfOnOutsidePage('/chats');
      this.alertService.displayLoginPrompt();
    }
    // when user wasn't logged in before:
    else if (err.status === 0) {  // server down
      this.router.navigate(['/']);
      this.serverUnavailableWhileLoggedOut.set(true);  // display err on the loading page
    }
    else if (err.status === 401) {  // unauthorized, go to login
      if (this.router.url != '/login')
        this.router.navigate(['/login']);
    }
    // unknown
    else {
      this.alertService.displayUnknownError(err);
    }
  }


  private handleRegisterError(err: any) {
    this.processing.set(false);
    if (err.status === 0) {
      this.alertService.displayServerConnectionError(true);
    }
    else {
      let msg: string = (err && err.error.message) ? err.error.message : 'error.unknown';

      // try to convert server error to translation key
      // invalid field
      if (msg.startsWith("invalid.")) {
        msg = this.toKebabCase(msg);
        msg = msg.replace("invalid.", "profile.");
        this.alertService.displayMessageAlert(AlertType.ERROR,
          `${this.translate.instant('common.form-field-invalid')}
          \n ${this.translate.instant(msg)}`
        );
      }
      // user with this X already exists
      else if (msg.startsWith("exists.")) {
        msg = this.toKebabCase(msg);
        let field = msg.replace("exists.", "profile.");
        field = this.translate.instant(field);

        this.alertService.displayMessageAlert(AlertType.ERROR,
          this.translate.instant('error.exists.description', { field: field }),
          undefined,
          this.translate.instant('error.exists.header'),
        );
      }
      // other
      else {
        this.alertService.displayErrorById(msg);
      }
    }
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private navigateIfOnOutsidePage(destination: string) {  // loading, login, register
    if (this.router.url === '/' || this.router.url === '/login' || this.router.url === '/register') {
      this.router.navigate([destination]);
    }
  }
}