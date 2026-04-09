import { Module } from "@nestjs/common";
import { HttpLoggingInterceptor } from "./http-logging.interceptor";
import { ServerErrorLoggingExceptionFilter } from "./server-error-filter";
import { LoggingService } from "./app-logger";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

// (this module is about logs, not authentication)

@Module({
  providers: [
    LoggingService,

    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ServerErrorLoggingExceptionFilter
    }
  ],
  exports: [LoggingService],
})
export class LoggingModule {}