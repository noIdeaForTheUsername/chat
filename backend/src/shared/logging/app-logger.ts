import { ArgumentsHost, ConsoleLogger, Injectable } from "@nestjs/common";
import { Severity } from "./logging-enums";
import { Request } from "express";
import { SessionEntity } from "src/domain/session/entity/session.entity";

@Injectable()
export class LoggingService extends ConsoleLogger {

  constructor() {
    super({
      timestamp: true,
      prefix: 'Chat Backend',
    });
  }

  // Logs client information, request details and the status it returned (HTTP requests only)
  httpLog(argumentsHost: ArgumentsHost, responseStatusCode: number) {
    if (argumentsHost.getType() !== 'http') return;

    const req: Request = argumentsHost.switchToHttp().getRequest();
    const session: SessionEntity = req.session as any;
    let sessionInfo = "No session";
    if (session?.userId) {
      sessionInfo = `UserId=${session.userId}`;
    }
    
    const message = `${req.ip} ${req.headers["user-agent"] ?? "Unknown User agent"} | ${sessionInfo} | `
      + `${req.method} ${req.url} -> ${responseStatusCode}`;
    this.log(message, 'HTTP');
  }

  // Logs security-related events
  securityLog(message: string, severity: Severity, context?: string) {
    const severityStr = Severity[severity];
    const consoleContext = `SECURITY LOG (Severity: ${severity} - ${severityStr})`;
    
    if (severity <= Severity.MEDIUM)
      this.log(message, consoleContext);
    else
      this.warn(message, consoleContext);
  }

  internalServerError(error: any, argumentsHost: ArgumentsHost, context?: string) {
    const consoleMessage = `-INTERNAL SERVER ERROR-`;
    this.error(consoleMessage, error, context ?? 'ContextNotProvided');
  }
}