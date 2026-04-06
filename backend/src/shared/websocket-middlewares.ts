import { AccountsDomainService } from "src/domain/accounts/accounts.service";
import { getSessionMiddleware } from "src/application/users/sessions/session.middleware";


export function getWsOriginFilterMiddleware(allowedOrigins: string[]) {
  return (socket: any, next: any) => {
    const origin = socket.handshake.headers.origin;
    const skip = allowedOrigins.length === 0 || origin === undefined;
    if (!skip
      && (!allowedOrigins.includes(origin))) {
      return next(new Error("websocket: origin not allowed"));
    }
    next();
  };
}

export function getWsSessionMiddleware() {
  const sessionMiddleware = getSessionMiddleware();
  return (socket: any, next: any) =>
    sessionMiddleware(socket.request, {} as any, next);
}

// This middleware can only be used AFTER the wsSessionMiddleware
export function getWsAuthMiddleware(accounts: AccountsDomainService) {
  return async (socket: any, next: any) => {
    // Check if session exists
    if (!((socket.request as any).session?.userId)) {
      return next(new Error("unauthorized"));
    }

    // Get account
    const userId = (socket.request as any).session.userId;
    const account = await accounts.findById(userId);

    // auth checks and errors
    if (!account)
      return next(new Error('not-found.user'));
    if (!account.activated)
      return next(new Error('account-inactive'));

    // success
    socket.data.userId = userId;
    next();
  }
}
