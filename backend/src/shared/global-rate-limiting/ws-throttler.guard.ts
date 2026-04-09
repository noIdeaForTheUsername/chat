import { ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { ThrottlerGuard, ThrottlerLimitDetail, ThrottlerRequest } from "@nestjs/throttler";
import { Socket } from "socket.io";

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {

  // private keysSeen: string[] = []; debug

  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
    } = requestProps;

    const client = context.switchToWs().getClient<Socket>();
    const tracker = client.data.userId ?? client.handshake.address;
    const key = this.generateKey(context, tracker, throttler.name ?? "default");
    
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(key, ttl, limit, blockDuration, throttler.name ?? "default");

    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }


  // contextless - limit for all endpoints/actions (unlike the HTTP throttler working per-endpoint)
  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    // suffix - tracker;  name - throttler name
    return `ws-${suffix}-${name}`;
  }
}
