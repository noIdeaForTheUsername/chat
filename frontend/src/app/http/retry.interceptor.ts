import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { delay, retryWhen, scan, takeUntil, timer } from "rxjs";


export const connectionErrorInterceptor: HttpInterceptorFn = (req, next) => {
  
  if (req.method === 'POST' || !navigator.onLine) {
    return next(req);
  }

  const globalTimeout$ = timer(7000);

  return next(req).pipe(

    retryWhen(errors =>
      errors.pipe(
        scan((retryCount, error: HttpErrorResponse) => {

          const isNetworkError = error.status === 0;
          const isServiceWorkerTimeout = error.status === 504;

          if (!isNetworkError && !isServiceWorkerTimeout) {
            throw error;
          }

          if (retryCount >= 3) {
            throw error;
          }

          return retryCount + 1;
        }, 0),

        delay(750),


        takeUntil(globalTimeout$)
      )
    ),

    takeUntil(globalTimeout$)
  );
}