import { HttpInterceptorFn } from "@angular/common/http";
import { API_URL } from "@app/config";
import { tap } from "rxjs";

// Detects Unauthorized HTTP responses, only from the backend API, and redirects to login page

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req).pipe(
//     tap({
//       error: (err) => {
//         if (req.url.startsWith(API_URL) && err.status === 401) {
//           // redirect to login page
//           window.location.href = API_URL + "/auth/login?redirect=" + encodeURIComponent(window.location.href);
//         }
//       }
//     })
//   );
// };
