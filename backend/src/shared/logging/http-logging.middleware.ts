import { BadGatewayException, CallHandler, ExecutionContext, Injectable, NestInterceptor, NestMiddleware } from "@nestjs/common";
import { catchError, tap, throwError } from "rxjs";
import { LoggingService } from "./app-logger";
import { error } from "console";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {

  constructor(
    private readonly logger: LoggingService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {

    res.on("close", () => {
      this.logger.httpLog(req, res.statusCode);
    });
    
    next();
  }
}