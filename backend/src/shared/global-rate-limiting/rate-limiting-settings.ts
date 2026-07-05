
// the HTTP rate limits are per-IP and per-endpoint, and don't include websockets;
// Entire-server limits should be set in reverse proxy
export const STANDARD_RATE_LIMIT = {
  fiveSeconds: {
    name: "fiveSeconds",
    ttl: 5 * 1000,
    limit: 30,
  },
  minute: {
    name: "minute",
    ttl: 60 * 1000,
    limit: 200,
  },
  day: {
    name: "day",
    ttl: 24 * 3600 * 1000,
    limit: 15000,
  },
}

export const SENSITIVE_RATE_LIMIT = {
  minute: {
    name: "minute",
    ttl: 60 * 1000,
    limit: 200,
  },
  day: {
    name: "day",
    ttl: 24 * 3600 * 1000,
    limit: 500,
  },
}

// websocket events rate limit unlike HTTP is not per-endpoint (per-event), but global for all events,
// and tracks by userId (because all ws events in the app require login)
export const WEBSOCKET_EVENTS_RATE_LIMIT = {
  fiveSeconds: { limit: 20, ttl: 5 * 1000 },
  minute: { limit: 100, ttl: 60 * 1000 },
  day: { limit: 15000, ttl: 24 * 3600 * 1000 },
}
