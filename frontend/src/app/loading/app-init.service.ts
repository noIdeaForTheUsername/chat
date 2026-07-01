import { inject, Injectable, signal } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Router } from "@angular/router";
import { AlertService } from "../alerts/alert-service/alert.service";
import { NotificationsService } from "../notifications/notifications.service";
import { isServerUnavailableError } from "../shared/errors/error-utils";


@Injectable({
  providedIn: "root"
})
export class AppInitService {

  private alertService = inject(AlertService);
  private notificationsService = inject(NotificationsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  
  // Settings
  // Pages that are accessible without login and considered "outside" of the main app
  private readonly outsidePages = ['/', "/#", '/login', '/register', "/account-inactive", "/installation-guide"];
  private readonly successStartPage = '/chats';

  public readonly loadingError = signal<string | null>(null);
  public readonly loadingErrorJson = signal<string | null>(null);
  public readonly preloading = signal(true);

  // public blockLoadPage = false;

  async initializeApp() {
    await this.loadAuthAndRedirect();
  }

  async loadAuthAndRedirect(): Promise<void> {
    this.auth.loadLocalAuth();
    // If the user was logged in before, don't even wait for auth check 
    // (server down, session expired, etc - this will be handled later with alerts without holding the user on the loading page)
    if (this.auth.getUserId() && this.isOnOutsidePage() && this.auth.getUserAccountActive()) {  
      this.preloading.set(false);
      if (this.isOnOutsidePage()) {
        this.router.navigateByUrl(this.successStartPage);
      }
    }

    // Refresh auth from the server (or load it for the first time)
    this.auth.loadServerAuth().subscribe({
      next: () => {
        // Successful auth load
        this.preloading.set(false);
        this.notificationsService.tryRefresingSubscription();
        if (this.auth.getUserId() && this.isOnOutsidePage()) {
          this.router.navigateByUrl(this.successStartPage);
        }
      },
      error: (err) => {
        this.handleGetAuthError(err);
      }
    });
  }

  private handleGetAuthError(err: any) {
    // Account inactive
    if (err.error?.message == "account-inactive") {
      localStorage.setItem("userAccountActive", "false");
      this.router.navigate(['/account-inactive']);
      return;
    }

    // Invalid credentials or server down:

    // User was logged in before (and should have already been redirected to the "inside" of the app at this point):
    const loggedInBefore = this.auth.getUserId() !== null && this.auth.getUserAccountActive();
    if (loggedInBefore && isServerUnavailableError(err)) {  // server down
      this.alertService.displayServerConnectionError();
      this.preloading.set(false);
    }
    else if (loggedInBefore && err.status === 401) {  // session expired
      this.auth.handleSessionExpiredError();
      this.preloading.set(false);
    }
    // User wasn't logged in before (redirect needed):
    else if (isServerUnavailableError(err)) {  // server unavailable
      this.router.navigateByUrl('/');
      this.loadingError.set("server-unavailable");  // display err on the loading page
      this.loadingErrorJson.set(JSON.stringify(err));
    }
    else if (err.status === 401) {  // server available but unauthorized, go to the welcome page
      if (!this.isOnOutsidePage()) {
        this.router.navigateByUrl('/');
      }
      this.preloading.set(false);
    }
    
    // unknown
    else {
      console.error("AppInitService, handleGetAuthError(): Unknown error during auth load: ", err);
      this.loadingError.set("unknown");
      this.alertService.displayUnknownError(err);
    }
  }

  private isOnOutsidePage(): boolean {
    const route = this.router.url.replace('#', '');

    return this.outsidePages.includes(route)
      /*|| this.outsidePages.includes(route.replace('#', ''))*/;
  }
}