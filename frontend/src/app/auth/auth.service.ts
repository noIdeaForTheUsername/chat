import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { AlertType } from "@app/alerts/alert-type.enum";
import { TranslateService } from "@ngx-translate/core";
import { AuthBackendApi, RegisterBody } from "./auth-api";
import { catchError, tap, throwError, timeout } from "rxjs";
import { UserAccount } from "./account.interface";
import { Capacitor, CapacitorCookies } from "@capacitor/core";
import { environment } from "@src/environments/environment.prod";


// Manages the user authenthication state, handles redirects and errors.
// This service also REDIRECTS FROM THE STARTER LOADING PAGE:
// "loadAuth", "handleGetAuthError", "navigateIfOnLoadingPage"


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Dependencies
  private translate = inject(TranslateService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);
  private api = new AuthBackendApi(this.http);
  private router = inject(Router);

  // User data
  private userId: number | null = null;
  private userAccountActive: boolean = false;
  // the below one will only load successfully if logged in and server available
  public readonly userAccount = signal<UserAccount | null>(null);  

  // State
  public readonly processing = signal(false);
  public readonly serverUnavailableWhileLoggedOut = signal(false);


  // USER ID / ACCOUNT-ACTIVE GETTERS & SETTERS

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

  public getUserAccountActive(): boolean {
    return this.userAccountActive;
  }

  // AUTHENTHCATION LOADING

  loadLocalAuth() {
    this.userId = Number(localStorage.getItem("userId")) || null;
    this.userAccountActive = localStorage.getItem("userAccountActive") === "true";
  }

  // check if the user is logged in and redirect / handle error accordingly
  loadServerAuth(timeoutMs: number = 6000) {
    return this.api.getAccount().pipe(
      timeout(timeoutMs),
      tap((res) => {
        this.processing.set(false);
        if (!res.id) {  // hopefully never happens
          this.alertService.displayError('unknown');
          throw new Error("Successful response but server didn't return the user ID.");
        }

        this.userAccountActive = true;
        localStorage.setItem("userAccountActive", "true");
        this.userAccount.set(res);
        this.setUserId(res.id);
      }),
      catchError((e) => {
        this.processing.set(false);
        return throwError(() => e);
      })
    );
  }
  
  // LOGIN & REGISTER & LOGOUT

  login(body: { phoneNumber: string; password: string }) {
    console.log("login called");
    this.processing.set(true);
    this.api.login(body).subscribe({
      next: (res) => {
        console.log("Login successful, response:", res);

        this.processing.set(false);
        window.location.replace("chats");
      },
      error: (err) => this.handleRegisterError(err)
    });
  }

  register(body: RegisterBody) {
    this.processing.set(true);

    return this.api.register(body).pipe(
      tap(_ => {
        try {
          localStorage.removeItem('registerFormDraft');
        } catch {
          // ignore storage errors
        }

        window.location.reload();
      }),
      catchError((err) => {
        this.handleRegisterError(err);
        return throwError(() => err);
      })
    );
  }


  logout() {
    this.api.logout().subscribe({
      next: () => {
        this.setUserId(null);
        window.location.replace("welcome");
      },
      error: () => {
        this.alertService.displayError('logout-failed');
      }
    });
  }

  // private async setSessionNativeCookie(res: any) {
  //   let session: string = "";
  //   console.log("trying to set native cookie");
  //   console.log("response: ", res);
  //   if (Capacitor.isNativePlatform() && (res.session || typeof res == "string")) {
  //     session = typeof res === "string" ? res.split("session=")[1] : res.session;
  //   }
  //   if (!session) {
  //     console.log("No session found in response, not setting native cookie.");
  //     return;
  //   }

  //   console.log("Setting cookie in WebView for native platform...");
  //     await CapacitorCookies.setCookie({
  //       url: environment.capacitorApiUrl,
  //       key: 'session',
  //       value: session
  //     });
  //     console.log("set. I think");
  // };


  // ACCOUNT DATA MODIFICATIONS

  updateAccount(updatedFieldsObject: Partial<UserAccount>) {
    return this.api.editAccount(updatedFieldsObject).pipe(
      tap((updatedAccount) => {
        this.userAccount.set(updatedAccount);
      }),
      catchError((err) => {
        this.handleRegisterError(err);
        return throwError(() => err);
      })
    );
  }


  // ERROR HANDLING

  


  private handleRegisterError(err: any) {
    this.processing.set(false);
    console.error("handling register error: ", err);
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
        this.alertService.displayError(msg);
      }
    }
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}