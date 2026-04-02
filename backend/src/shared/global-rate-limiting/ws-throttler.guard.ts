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
      generateKey,
    } = requestProps;

    const client = context.switchToWs().getClient<Socket>();
    const tracker = client.data.userId ?? client.handshake.address;
    const key = this.generateKey(context, tracker, throttler.name ?? "default");
    
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(key, ttl, limit, blockDuration, throttler.name ?? "default");

    // debug logs
    // console.log("--- WsThrottlerGuard");
    // console.log("client IP: ", ip);
    // console.log("tracker: ", tracker);
    // console.log("throttler name: ", throttler.name ?? "default");
    // console.log("Generated key: ", key);
    // console.log("totalHits: ", totalHits);
    // console.log("isBlocked: ", isBlocked);
    // if (!this.keysSeen.includes(key))
    //   this.keysSeen.push(key);
    // console.log("keysSeen: ", this.keysSeen);
    // console.log("WsThrottlerGuard ---");
    

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




// OLD WORKING VER:
// async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
//     const {
//       context,
//       limit,
//       ttl,
//       throttler,
//       blockDuration,
//       getTracker,
//     } = requestProps;

//     const client = context.switchToWs().getClient<Socket>();
//     const request = client.request as Socket['request'] & {
//       session?: { userId?: number | string };
//     };
//     const userId = client.data?.userId ?? request?.session?.userId;
//     const tracker = userId
//       ? `user:${userId}`
//       : (await getTracker(request ?? {}, context)) ??
//         client?.handshake?.address ??
//         client?.conn?.remoteAddress ??
//         "unknown";

//     const key = this.generateWsKey(context, tracker, throttler.name ?? 'default');
//     const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
//       await this.storageService.increment(
//         key,
//         ttl,
//         limit,
//         blockDuration,
//         throttler.name ?? "default",
//       );

//     // Throw an error when the user reached their limit.
//     if (isBlocked) {
//       await this.throwThrottlingException(context, {
//         limit,
//         ttl,
//         key,
//         tracker,
//         totalHits,
//         timeToExpire,
//         isBlocked,
//         timeToBlockExpire,
//       });
//     }

//     return true;
//   }

//   private generateWsKey(
//     context: ExecutionContext,
//     tracker: string,
//     throttlerName: string,
//   ): string {
//     return `ws:${context.getClass().name}:${throttlerName}:${tracker}`;
//   }

//   protected async throwThrottlingException(
//     _context: ExecutionContext,
//     throttlerLimitDetail: ThrottlerLimitDetail,
//   ): Promise<void> {
//     throw new WsException({
//       code: "rate-limit-exceeded",
//       message: "Too Many Requests",
//       details: {
//         limit: throttlerLimitDetail.limit,
//         ttl: throttlerLimitDetail.ttl,
//         totalHits: throttlerLimitDetail.totalHits,
//         timeToExpire: throttlerLimitDetail.timeToExpire,
//         timeToBlockExpire: throttlerLimitDetail.timeToBlockExpire,
//       },
//     });
//   }