import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  const apiReq = req.url.startsWith('/') ? req.url.slice(1) : req.url;

  req = req.clone({
    url: `${apiUrl}/${apiReq}`
  });

  return next(req);
};
