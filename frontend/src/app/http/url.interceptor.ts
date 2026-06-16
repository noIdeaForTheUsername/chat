import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiUrlService } from './url.service';

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
  const urlService = inject(ApiUrlService);
  const apiReq = req.url.startsWith('/') ? req.url.slice(1) : req.url;

  req = req.clone({
    url: `${urlService.apiUrl}/${apiReq}`
  });

  return next(req);
};
