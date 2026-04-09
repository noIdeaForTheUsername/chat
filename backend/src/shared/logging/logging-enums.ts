
// Security logs importance levels

export enum Severity {
  // common, expected events (like login attempts)
  LOW = 1,

  // less frequent and more meaningful, but still expected events (like password changes)
  MEDIUM = 2,

  // unusual, important events that might indicate danger
  // (like a very high amount of failed logins from multiple IPs, important rate limits)
  HIGH = 3,

  // very important events that might affect the security of the entire server
  // (like admin status change)
  CRITICAL = 4,
}
