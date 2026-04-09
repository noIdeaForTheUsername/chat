
export interface RateLimitedAction {
  name: string,
  limit: number,
  ttl: number,  // milliseconds
  logExceeded?: boolean,  // Security log when the limit is exceeded, default false
}
