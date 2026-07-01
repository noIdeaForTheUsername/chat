import { Module } from "@nestjs/common";
import { ServerErrorLoggingExceptionFilter } from "../server-error-filter";
import { LoggingService } from "./app-logger";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpLoggingMiddleware } from "./http-logging.middleware";

// (this module is about logs, not authentication)

@Module({
  providers: [
    LoggingService,
    ServerErrorLoggingExceptionFilter,
    HttpLoggingMiddleware,

    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: HttpLoggingInterceptor,
    // },
    // {
    //   provide: APP_FILTER,
    //   useClass: ServerErrorLoggingExceptionFilter
    // }
  ],
  exports: [LoggingService, ServerErrorLoggingExceptionFilter, HttpLoggingMiddleware],
})
export class LoggingModule {}