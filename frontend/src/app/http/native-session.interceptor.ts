// import { Injectable } from '@angular/core';
// import {
//   HttpInterceptor,
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpResponse,
//   HttpInterceptorFn
// } from '@angular/common/http';
// import { Observable, tap } from 'rxjs';
// import { Capacitor } from '@capacitor/core';
// import { CapacitorCookies } from '@capacitor/core';
// import { environment } from '@src/environments/environment.prod';

// // This takes cookie from the response body and sets it as a cookie in the WebView on native platforms only
// // (web clients should receive more secure HttpOnly cookies via Set-Cookie header, so this interceptor does not interfere with them)

// const setSessionCookie = async (session: string) => {
//   console.log("Setting cookie in WebView for native platform...");
//     await CapacitorCookies.setCookie({
//       url: environment.capacitorApiUrl,
//       key: 'session',
//       value: session
//     });
//     console.log("set. I think");
// };

// export const nativeSessionInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req).pipe(
//     tap({
//       next: (event: any) => {

//       console.log("NativeSessionInterceptor - processing response", event);
//       console.log("Is native platform?", Capacitor.isNativePlatform());
//       // console.log("event instanceof HttpResponse:", (event instanceof HttpEvent<unknown>));

//       // if (!(event instanceof HttpResponse)) return;
//       if (!Capacitor.isNativePlatform()) return;
      
//       console.log("event body:", event.body, "typeof string? ", typeof event.body === "string");

//       let session;
//       if (typeof event.body === "string") {
//         const splitBody = event.body.split("session=");
//         console.log("splitBody:", splitBody);
//         console.log("falsy split body:", !splitBody);
//         console.log("split body length:", splitBody ? splitBody.length : "splitBody is falsy");
        
//         if (!splitBody || splitBody.length < 2) return;

//         session = splitBody[1];
//         console.log("Extracted session from body:", session);
//       }
//       else if (typeof event.body?.session === "string") {
//         session = event.body.session;
//         console.log("Extracted session from body.session:", session);
//       }
//       else {
//         return;
//       }

//       setSessionCookie(session);

//     }})
//   );
// };