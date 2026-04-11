import { ArgumentsHost, Catch, HttpException, Injectable } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Response } from "express";
import { LoggingService } from "./app-logger";

@Catch()
@Injectable()
export class ServerErrorLoggingExceptionFilter extends BaseExceptionFilter {

  constructor(
    private readonly logger: LoggingService,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;

    const internalServerError = exception instanceof HttpException && exception.getStatus() === 500;

    if (!(exception instanceof HttpException)
      || internalServerError
    ) {
      this.logger.internalServerError(exception);
      if (internalServerError) {  // Override the message for internal server errors
        (exception as any).getResponse().message = "Internal Server Error";
      }
    }
    super.catch(exception, host);
  }
}