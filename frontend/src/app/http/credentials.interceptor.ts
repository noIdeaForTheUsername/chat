import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';


export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // adds credentials for all (and only for) backend API requests
  let backendUrl = Capacitor.isNativePlatform()
    ? environment.capacitorApiUrl
    : environment.apiUrl;

  if (backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }

  req = req.clone({
    withCredentials: req.url.startsWith(backendUrl)
  });
  return next(req);
};
