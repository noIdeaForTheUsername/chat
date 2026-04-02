
export interface RateLimitedAction {
  name: string,
  limit: number,
  ttl: number,  // milliseconds
}
