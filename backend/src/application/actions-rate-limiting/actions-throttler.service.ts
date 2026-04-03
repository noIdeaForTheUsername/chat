import { HttpException, Injectable } from "@nestjs/common";
import { RateLimitedAction } from "./rate-limited-action.interface";


interface TrackedAction {
  hits: number;
  expires: number;  // timestamp
}


@Injectable()
export class ActionsThrottlerService {

  private trackedActions: Map<string, TrackedAction> = new Map();

  private trackedActionsCleanupIterator: MapIterator<[string, TrackedAction]> | null = null;
  private readonly trackedActionsCleanupMaxChecks = 5000;
  private readonly requestsPerTrackedActionsCleanup = 2500;
  private requestsSinceLastTrackedActionsCleanup = 0;

  constructor() {}


  // PUBLIC METHODS

  public incrementAndThrow(action: RateLimitedAction, tracker: string) {
    const allowed = this.incrementAndGetReqAllowed(action, tracker);
    if (!allowed) throw new HttpException('ThrottlerException: Too Many Requests', 429);
  }

  public incrementAndGetReqAllowed(action: RateLimitedAction, tracker: string): boolean {
    return this.incrementAndGetStatus(action, tracker).allowed;
  }

  // Increments the rate limit for the specific action and tracker (for example, IP and account creation),
  // returns true if the request is allowed (under the limit)
  public incrementAndGetStatus(action: RateLimitedAction, tracker: string) {
    
    const key = this.getTrackedActionKey(action, tracker);
    const now = new Date().getTime();
    let tracked = this.trackedActions.get(key);
    let limitExceeded = false;
    this.handleTrackedActionsCleanup();

    // treat as non-existent if expired
    if (tracked?.expires && now > tracked?.expires)
      tracked = undefined;  

    // increment and check limits
    if (tracked) {
      tracked.hits++;
      limitExceeded = (tracked.hits > action.limit);
    }
    else {
      tracked = {
        hits: 1,
        expires: now + action.ttl,
      }
    }
    
    this.trackedActions.set(key, tracked);
    return { allowed: !limitExceeded, hits: tracked.hits, limit: action.limit, expires: tracked.expires };
  }

  public decrement(action: RateLimitedAction, tracker: string) {
    const key = this.getTrackedActionKey(action, tracker);
    let tracked = this.trackedActions.get(key);
    if (tracked && tracked.hits > 0) {
      tracked.hits--;
      this.trackedActions.set(key, tracked);
    }
  }

  public resetLimit(action: RateLimitedAction, tracker: string) {
    const key = this.getTrackedActionKey(action, tracker);
    this.trackedActions.delete(key);
  }



  // PRIVATE METHODS

  private getTrackedActionKey(action: RateLimitedAction, tracker: string) {
    return `${action.name}:${tracker}`;
  }

  private handleTrackedActionsCleanup() {
    this.requestsSinceLastTrackedActionsCleanup = 
      (this.requestsSinceLastTrackedActionsCleanup + 1) % this.requestsPerTrackedActionsCleanup;
    if (this.requestsSinceLastTrackedActionsCleanup === 0) {
      this.cleanupTrackedActions();
    }
  }

  // Checks and deletes max *trackedActionsCleanupMaxChecks* expired entries in the trackedActions map
  // If there are more, checks will be continued in next calls from where they stopped
  private cleanupTrackedActions() {
    if (this.trackedActionsCleanupIterator === null)
      this.trackedActionsCleanupIterator = this.trackedActions.entries();

    let checks = 0;
    const now = new Date().getTime();

    let result = this.trackedActionsCleanupIterator.next();
    while (checks < this.trackedActionsCleanupMaxChecks && !result.done) {
      if (now > result.value[1].expires) {
        this.trackedActions.delete(result.value[0]);
      }
      checks++;
      result = this.trackedActionsCleanupIterator.next();
    }

    if (result.done) {
      this.trackedActionsCleanupIterator = null;
    }
  }
}
