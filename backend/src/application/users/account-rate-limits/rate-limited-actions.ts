import { RateLimitedAction } from "src/application/shared/actions-rate-limiting/rate-limited-action.interface";

// LOGIN

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
  logExceeded: true,
};

// Tracked by account (phone number), doesn't look for IP. Delays server responses, but doesn't block it
export const GLOBAL_DELAYING_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {
  name: 'GLOBAL_DELAYING_ACCOUNT_LOGIN',
  limit: 15,
  ttl: 24 * 3600 * 1000, // day
  logExceeded: true,
};
// tracked by phone number only too, but if it's get hit then it blocks and it's a strong attack indicator
export const GLOBAL_BLOCKING_LOGIN_LIMIT_PER_ACCOUNT: RateLimitedAction = {
  name: 'GLOBAL_BLOCKING_ACCOUNT_LOGIN',
  limit: 100,
  ttl: 3600 * 1000, // hour
  logExceeded: true,
};

// PASSWORD-PROTECTED ACTIONS (like password reset, global logout), tracker by sessionIdHash
export const PASSWORD_PROTECTED_ACTION_LIMIT_PER_SESSION: RateLimitedAction = {
  name: 'PASSWORD_PROTECTED_SESSION_ACTION',
  limit: 10,
  ttl: null,
  logExceeded: true,
}

// ACCOUNT CREATION
// counts only successful account creations, tracked by IP
export const ACCOUNT_CREATION_LIMIT: RateLimitedAction = {  
  name: 'ACCOUNT_CREATION',
  limit: 50,
  ttl: 3 * 24 * 3600 * 1000, // 3 days
  logExceeded: true,
};
