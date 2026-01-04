import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';


export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // adds credentials for all (and only for) backend API requests

  req = req.clone({
    withCredentials: req.url.startsWith(environment.apiUrl)
  });
  return next(req);
};
