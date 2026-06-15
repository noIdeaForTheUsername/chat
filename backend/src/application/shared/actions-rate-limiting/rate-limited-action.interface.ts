
export interface RateLimitedAction {
  name: string,
  limit: number,
  ttl: number | null,  // milliseconds or null for never-automatically-expiring action
  logExceeded?: boolean,  // Security log when the limit is exceeded, default false
}
