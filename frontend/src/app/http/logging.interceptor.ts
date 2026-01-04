import { HttpInterceptorFn } from '@angular/common/http';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`-- HTTP Request: --
    URL: ${req.url}
    Method: ${req.method}
    Credentials included: ${req.withCredentials}
    Payload: ${req.body ? JSON.stringify(req.body) : 'N/A'}
  `);

  return next(req);
};
