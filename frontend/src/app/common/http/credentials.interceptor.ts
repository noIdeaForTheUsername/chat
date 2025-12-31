import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '@app/config';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // adds credentials for all (and only for) backend API requests
  req = req.clone({
    withCredentials: req.url.startsWith(API_URL)
  });
  return next(req);
};
