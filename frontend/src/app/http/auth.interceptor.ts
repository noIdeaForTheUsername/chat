import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { environment } from "src/environments/environment";
import { tap } from "rxjs";
import { Capacitor } from "@capacitor/core";

// Detects Unauthorized HTTP responses (401), only from the backend API, and redirects to login page

let platformApiUrl = Capacitor.isNativePlatform() ? environment.capacitorApiUrl : environment.apiUrl;
if (platformApiUrl.endsWith('/'))
  platformApiUrl = platformApiUrl.slice(0, -1);
const authUrl = `${platformApiUrl}/auth`.replace("//api", "/api").replace("//auth", "/auth");

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);

  // don't mess with auth service's job
  if (req.url.startsWith(authUrl)) return next(req);

  return next(req).pipe(
    tap({
      error: (err) => {
        if (req.url.startsWith(platformApiUrl) && err.status === 401 && err.error?.message !== "account-inactive") {
          alertService.displayLoginPrompt();
        }
      }
    })
  );
};
