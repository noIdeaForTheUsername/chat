// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';


// // This interceptor adds the session cookie value to the response body, so that the native Capacitor client can access it even if WebView blocks cookies (a workaround).
// // The native client may then set the cookie via JS. The web client should ignore this field and only rely on more secure HttpOnly cookies. Therefore,
// // it doesn't really worsen the web client security, as it will still use HttpOnly and the session id will only be exposed in the response body during login
// // - and an XSS attack during login could as well steal the login credentials, even with HttpOnly cookies and no session in the response body at all.


// @Injectable()
// export class SessionInBodyInterceptor implements NestInterceptor {

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

//     const ctx = context.switchToHttp();
//     const res = ctx.getResponse();

//     return next.handle().pipe(
//       map((data) => {

//         console.log("--SessionInBodyInterceptor log--");
//         console.log("res.getHeader('set-cookie');", res.getHeader('set-cookie'));
//         console.log("res.getHeaders();", res.getHeaders());
//         const setCookie = res.getHeader('set-cookie');

//         if (!setCookie) return data;

//         const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

//         const sessionCookie = cookies.find((c: string) =>
//           c.startsWith('session=')
//         );

//         console.log("sessionCookie:", sessionCookie);

//         if (!sessionCookie) return data;

//         const value = sessionCookie.split(';')[0].split('=')[1];

//         console.log("value:", value);

//         return {
//           ...data,
//           session: value
//         };

//       })
//     );
//   }
// }