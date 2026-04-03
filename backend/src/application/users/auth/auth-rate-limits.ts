import { RateLimitedAction } from "src/application/actions-rate-limiting/rate-limited-action.interface";

// Advanced rate limits, besides the standard @Throttle limits


// tracked by IP and entered phone number
export const SHORT_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {  
  name: 'ACCOUNT_LOGIN_SHORT',
  limit: 10,
  ttl: 10 * 60 * 1000,  // 10 minutes
};
export const LONG_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {  
  name: 'ACCOUNT_LOGIN_LONG',
  limit: 20,
  ttl: 24 * 3600 * 1000, // day
};

// Tracked by account (phone number), doesn't look for IP. Delays server responses, but doesn't block it
export const GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {
  name: 'GLOBAL_DELAYING_ACCOUNT_LOGIN',
  limit: 15,
  ttl: 24 * 3600 * 1000, // day
};
// tracked by phone number only too, but if it's get hit then it blocks and it's a strong attack indicator
export const GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {
  name: 'GLOBAL_BLOCKING_ACCOUNT_LOGIN',
  limit: 100,
  ttl: 3600 * 1000, // hour
};

// counts only successful account creations, tracked by IP
export const ACCOUNT_CREATION_LIMIT: RateLimitedAction = {  
  name: 'ACCOUNT_CREATION',
  limit: 50,
  ttl: 3 * 24 * 3600 * 1000, // 3 days
};