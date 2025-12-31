import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { AlertType } from "@app/alerts/alert-type.enum";
import { UserProfile } from "@app/profiles/profile.interface";
import { AuthBackendApi, RegisterBody } from "./auth-api";
import { Router } from "@angular/router";
import { LoadingService } from "@app/loading/loading-service/loading.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private translate = inject(TranslateService);
  private alertService = inject(AlertService);
  private loadingService = inject(LoadingService);
  private http = inject(HttpClient);
  private api = new AuthBackendApi(this.http);
  private router = inject(Router);

  private userId: number | null = null;
  public readonly getUserId = () => this.userId;
  public readonly processing = signal(false);


  constructor() {
    this.userId = Number(localStorage.getItem("userId")) || null;
    console.log("userId: ", this.userId);
  }

  private setUserId(id: number | null) {
    this.userId = id;
    if (id === null) localStorage.removeItem("userId");
    else localStorage.setItem("userId", id.toString());
  }


  // check if the user is logged in and redirect accordingly
  loadAuth() {
    this.api.getMe().subscribe({
      next: (res) => {
        this.processing.set(false);
        if (!res.id) {  // hopefully an impossible error
          this.alertService.displayErrorById('unknown');
          throw new Error("Successful response but authenticated user has no ID.");
        }
        // redirect to chats after successful login
        this.setUserId(res.id);
        this.router.navigate(['/chats']);
      },
      error: (e) => {
        // Don't block the start of the app if the user was logged in before (session expired, server down, etc)
        if (e.status === 0 && this.userId !== null) {
          this.router.navigate(['/chats']);
          this.alertService.displayServerConnectionError();
        }
        else if (e.status === 401 && this.userId !== null) {
          this.router.navigate(['/chats']);
          this.alertService.displayPromptAlert(AlertType.PROMPT,
            this.translate.instant("error.session-expired.description"),
            () => this.router.navigate(['/login']),
            undefined,
            this.translate.instant("error.session-expired.header"),
          );
        }
        // when user wasn't logged in before:
        else if (e.status === 0) {
          this.loadingService.reportError("0");  // server connection err
        }
        else if (e.status === 401) {  // unauthorized, go to login
          this.router.navigate(['/login']);
        }
        else {
          this.alertService.displayErrorById('unknown');
        }
      }
    });
  }
  
  // LOGIN & REGISTER

  login(body: { account: string; password: string }) {
    this.processing.set(true);
    this.api.login(body).subscribe({
      next: (res: any) => {
        this.loadAuth();
      },
      error: (err) => this.handleError(err)
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
        this.loadAuth();
      },
      error: (err) => this.handleError(err)
    });
  }


  // LOGOUT
  logout() {
    this.api.logout().subscribe({
      next: () => {
        this.setUserId(null);
        this.router.navigate(['/login']);
        this.alertService.displayMessageAlert(AlertType.INFO,
          this.translate.instant("prompt.logout-success.description")
        );
      },
      error: () => {
        this.alertService.displayErrorById('logout-failed');
      }
    });
  }


  // ERROR HANDLING

  private handleError(err: any) {
    this.processing.set(false);
    if (err.status === 0) {
      this.alertService.displayServerConnectionError();
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
}