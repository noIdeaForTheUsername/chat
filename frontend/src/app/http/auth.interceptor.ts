import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { API_URL } from "@app/config";
import { tap } from "rxjs";

// Detects Unauthorized HTTP responses (401), only from the backend API, and redirects to login page

const authUrl = `${API_URL}/auth`.replace("//auth", "/auth");

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);

  // don't mess with auth service's job
  console.log("authUrl: ", authUrl);
  console.log("req.url: ", req.url);
  if (req.url.startsWith(authUrl)) return next(req);


  return next(req).pipe(
    tap({
      error: (err) => {
        if (req.url.startsWith(API_URL) && err.status === 401) {
          alertService.displayLoginPrompt();
          console.log("authInterceptor: detected 401 from backend API: PROMPTING LOGIN!");
        }
      }
    })
  );
};
