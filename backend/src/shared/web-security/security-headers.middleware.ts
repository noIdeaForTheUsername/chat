// import { Injectable, NestMiddleware } from "@nestjs/common";
// import { Request, Response, NextFunction } from "express";
// import { ConfigService } from "@nestjs/config";
// import { timeStamp } from "console";

// @Injectable()
// export class SecurityHeadersMiddleware implements NestMiddleware {

//   private readonly enableCsp: boolean;
//   private readonly https: boolean;
//   private readonly hstsDays: number;
//   private readonly hstsHeaderValue: string;

//   constructor(private readonly config: ConfigService) {
//     this.enableCsp = this.config.get("httpSecurity.csp") ?? false;
//     this.https = this.config.get("httpSecurity.https") ?? false;

//     this.hstsDays = this.config.get("httpSecurity.hstsDays") ?? 0;
//     this.hstsHeaderValue = `max-age=${this.hstsDays * 24 * 60 * 60};`;
//   }

//   use(req: Request, res: Response, next: NextFunction) {

//     // CSP
//     if (this.enableCsp) {
//       const updateInsecureRequests = this.https ? "upgrade-insecure-requests;" : "";
//       res.setHeader(
//         "Content-Security-Policy",
//         `default-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self';
//         frame-ancestors 'none'; 
//         ${updateInsecureRequests}`);
//     }
    
//     // HSTS
//     if (this.https && this.hstsDays > 0) {
//       res.setHeader("Strict-Transport-Security", this.hstsHeaderValue);
//     }

//     // Other
//     res.setHeader("Cross-Origin-Resource-Policy", "same-site");
//     res.setHeader("X-Content-Type-Options", "nosniff");
    
//     next();
//   }
// }