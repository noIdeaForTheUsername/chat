import { ArgumentsHost, BadRequestException, Catch } from "@nestjs/common";
import { ServerErrorLoggingExceptionFilter } from "src/shared/server-error-filter";


@Catch()
export class RequestAbortedExceptionFilter extends ServerErrorLoggingExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception.message == "Request aborted") {
      exception = new BadRequestException("Request aborted");
    }
    super.catch(exception, host);
  }
}