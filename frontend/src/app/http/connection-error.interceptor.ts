import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AlertService } from "@app/alerts/alert-service/alert.service";
import { catchError, throwError } from "rxjs";


export const connectionErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);

  
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 0 || err.status === 504) {
        alertService.displayServerConnectionError();
      }
      return throwError(() => err);
    })
  );
};