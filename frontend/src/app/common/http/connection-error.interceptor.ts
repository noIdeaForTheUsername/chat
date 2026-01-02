import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { catchError, throwError } from "rxjs";

let connectionErrorCaught = false;

export const connectionErrorInterceptor: HttpInterceptorFn = (req, next) => {
  let alertService = inject(AlertService);


  if (connectionErrorCaught) {
    return next(req);
  }
  
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 0 && !connectionErrorCaught) {
        connectionErrorCaught = true;
        alertService.displayServerConnectionError();
      }
      return throwError(() => err);
    })
  );
};