import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '@app/config';

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const apiReq = req.url.startsWith('/') ? req.url.slice(1) : req.url;

  req = req.clone({
    url: `${apiUrl}/${apiReq}`
  });

  return next(req);
};
