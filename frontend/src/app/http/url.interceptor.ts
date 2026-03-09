import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
  let apiUrl; 
  if (Capacitor.isNativePlatform()) {
    apiUrl = environment.capacitorApiUrl.endsWith('/') ? environment.capacitorApiUrl.slice(0, -1) : environment.capacitorApiUrl;
  } else {
    apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  }
  const apiReq = req.url.startsWith('/') ? req.url.slice(1) : req.url;

  req = req.clone({
    url: `${apiUrl}/${apiReq}`
  });

  return next(req);
};
