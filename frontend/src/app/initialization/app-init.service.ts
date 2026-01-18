import { inject, Injectable, signal } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Router } from "@angular/router";
import { AlertService } from "../alerts/alert-service/alert.service";
import { NotificationsService } from "../notifications/notifications.service";


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
  private readonly outsidePages = ['/', '/login', '/register', "/welcome", "/account-inactive"];
  private readonly successStartPage = '/chats';

  public readonly serverUnavailableWhileLoggedOut = signal(false);

  async initializeApp() {
    await this.loadAuthAndRedirect();
  }

  async loadAuthAndRedirect(): Promise<void> {
    this.auth.loadLocalAuth();
    // If the user was logged in before, don't even wait for auth check 
    // (server down, session expired, etc - this will be handled later with alerts without holding the user on the loading page)
    if (this.auth.getUserId() && this.isOnOutsidePage() && this.auth.getUserAccountActive()) {  
      if (this.isOnOutsidePage()) {
        this.router.navigateByUrl(this.successStartPage);
      }
    }

    // Refresh auth from the server (or load it for the first time)
    this.auth.loadServerAuth().subscribe({
      next: () => {
        // Successful auth load
        this.notificationsService.sendSubscriptionIfAvailable();
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
    const previouslyAuthorized = this.auth.getUserId() !== null && this.auth.getUserAccountActive();
    if (previouslyAuthorized && (err.status === 0 || err.status === 504 || err.name === 'TimeoutError')) {  // server down
      this.alertService.displayServerConnectionError();
    }
    else if (previouslyAuthorized && err.status === 401) {  // session expired
      this.alertService.displayLoginPrompt();
    }
    // User wasn't logged in before (redirect needed):
    else if (err.status === 0 || err.status === 504 || err.name === 'TimeoutError') {  // server down
      this.router.navigateByUrl('/');
      this.serverUnavailableWhileLoggedOut.set(true);  // display err on the loading page
    }
    else if (err.status === 401) {  // unauthorized, go to welcome (from where the user can login/register)
      this.router.navigateByUrl('/welcome');
    }
    
    // unknown
    else {
      this.alertService.displayUnknownError(err);
    }
  }

  private isOnOutsidePage(): boolean {
    return this.outsidePages.includes(window.location.pathname);
  }
}