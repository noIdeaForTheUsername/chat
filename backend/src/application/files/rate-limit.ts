export const FILES_UPLOAD_RATE_LIMIT = {
  fiveSeconds: {
    name: "fiveSeconds",
    ttl: 5 * 1000,
    limit: 20,
  },
  minute: {
    name: "minute",
    ttl: 60 * 1000,
    limit: 200,
  },
  day: {
    name: "day",
    ttl: 24 * 3600 * 1000,
    limit: 2000,
  },
};