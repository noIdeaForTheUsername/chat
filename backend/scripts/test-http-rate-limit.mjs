#!/usr/bin/env node

// const HOST = process.env.HTTP_HOST ?? 'http://localhost:3000';
// const PATH = process.env.HTTP_PATH ?? '/auth/login';
const URL = "http://localhost:3000/conversations/1/messages";
const METHOD = (process.env.HTTP_METHOD ?? 'POST').toUpperCase();
const TOTAL_REQUESTS = Number(process.env.HTTP_TOTAL_REQUESTS ?? 20);
const CONCURRENCY = Number(process.env.HTTP_CONCURRENCY ?? 25);
const TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS ?? 5000);
const COOKIE = process.env.HTTP_COOKIE ?? 'session=s%3AaddGcC_J8PtCLp-8odd0v1RqTXTIhADp.ldfEcmxU79cQNKWBa6LipQ3TypaH8A2KSgNncKS4ARo';

// const BODY = '';
const BODY = {
  conversationId: 1,
  text: "Hello",
};
const EXTRA_HEADERS = process.env.HTTP_HEADERS ?? '';

if (!Number.isFinite(TOTAL_REQUESTS) || TOTAL_REQUESTS <= 0) {
  throw new Error('HTTP_TOTAL_REQUESTS must be a positive number');
}
if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
  throw new Error('HTTP_CONCURRENCY must be a positive number');
}
if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS <= 0) {
  throw new Error('HTTP_TIMEOUT_MS must be a positive number');
}

let parsedHeaders = {};
if (EXTRA_HEADERS) {
  try {
    parsedHeaders = JSON.parse(EXTRA_HEADERS);
  } catch {
    throw new Error('HTTP_HEADERS must be valid JSON object string');
  }
}

const headers = {
  ...parsedHeaders,
};

if (COOKIE) {
  headers.Cookie = COOKIE;
}

let body;
if (BODY) {
  body = JSON.stringify(BODY);
  headers['Content-Type'] = 'application/json';
  // if (!headers['Content-Type'] && !headers['content-type']) {
    
  // }
}

let startedCount = 0;
let completedCount = 0;

let okCount = 0;
let rateLimitedCount = 0;
let unauthorizedCount = 0;
let otherStatusCount = 0;
let networkErrorCount = 0;

const statusCounters = new Map();
const sampleRateLimitedBodies = [];

const startedAt = Date.now();

function incStatus(status) {
  statusCounters.set(status, (statusCounters.get(status) ?? 0) + 1);
}

async function singleRequest() {
  const current = startedCount;
  startedCount += 1;

  if (current >= TOTAL_REQUESTS) return;

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(URL, {
      method: METHOD,
      headers,
      body,
      signal: ctrl.signal,
    });
    console.log("res: ", response);

    incStatus(response.status);

    console.log("res.text(): ", await response.text());

    if (response.ok) {
      okCount += 1;
    } else if (response.status === 429) {
      rateLimitedCount += 1;
      if (sampleRateLimitedBodies.length < 3) {
        const text = await response.text();
        sampleRateLimitedBodies.push(text);
      }
    } else if (response.status === 401 || response.status === 403) {
      unauthorizedCount += 1;
    } else {
      otherStatusCount += 1;
    }
  } catch {
    networkErrorCount += 1;
  } finally {
    clearTimeout(timeoutId);
    completedCount += 1;
  }
}

async function worker() {
  while (startedCount < TOTAL_REQUESTS) {
    await singleRequest();
  }
}

async function run() {
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const durationMs = Date.now() - startedAt;
  console.log('--- HTTP rate-limit test report ---');
  console.log(`url=${URL}`);
  console.log(`method=${METHOD}`);
  console.log(`totalRequested=${TOTAL_REQUESTS}`);
  console.log(`completed=${completedCount}`);
  console.log(`okCount=${okCount}`);
  console.log(`rateLimited429=${rateLimitedCount}`);
  console.log(`unauthorized401_403=${unauthorizedCount}`);
  console.log(`otherStatusCount=${otherStatusCount}`);
  console.log(`networkErrorCount=${networkErrorCount}`);
  console.log(`durationMs=${durationMs}`);

  const sorted = [...statusCounters.entries()].sort((a, b) => a[0] - b[0]);
  console.log('statusBreakdown=', JSON.stringify(Object.fromEntries(sorted)));

  if (sampleRateLimitedBodies.length > 0) {
    console.log('sample429Bodies=', JSON.stringify(sampleRateLimitedBodies));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
