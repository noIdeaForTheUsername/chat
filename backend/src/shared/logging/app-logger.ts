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
  httpLog(req: Request, responseStatusCode: number) {

    const session: SessionEntity = req.session as any;
    let sessionInfo = "No session";
    if (session?.userId && session?.sidHash) {
      sessionInfo = `UserId: ${session.userId ?? "noUserId"}; SidHash: ${session.sidHash ?? "noHash"}`;
    }
    
    const message = `${req.method} ${req.url} -> ${responseStatusCode}`
    + `\nClient: ${req.ip} ${req.headers["user-agent"] ?? "Unknown User agent"} | ${sessionInfo}`
    this.log(message, 'HTTP');
  }

  // Logs security-related events
  securityLog(message: string, severity: Severity, context?: string) {
    const severityStr = Severity[severity];
    const contextStr = context ? `:${context}` : '';
    const consoleContext = `SECURITY${contextStr} | Severity:${severityStr}`;
    
    if (severity <= Severity.MEDIUM)
      this.log(message, consoleContext);
    else
      this.warn(message, consoleContext);
  }

  internalServerError(error: any, context?: string) {
    const consoleMessage = `-INTERNAL SERVER ERROR-`;
    this.error(consoleMessage, error, context ?? 'ContextNotProvided');
  }
}