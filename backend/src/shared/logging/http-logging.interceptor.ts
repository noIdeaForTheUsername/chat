import { BadGatewayException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, tap, throwError } from "rxjs";
import { LoggingService } from "./app-logger";
import { error } from "console";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {

  constructor(
    private readonly logger: LoggingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') return next.handle();

    return next.handle().pipe(
      tap((res) => {
        this.logger.httpLog(context, context.switchToHttp().getResponse().statusCode);
      }),
      catchError((error) => {
        this.logger.httpLog(context, error.status ?? "UNKNOWN-ERROR (supposed to fallback to 500)");
        return throwError(() => error);
      }),
    );
  }
}