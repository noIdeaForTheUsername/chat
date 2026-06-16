#!/usr/bin/env node

let io;
try {
  ({ io } = await import('socket.io-client'));
} catch {
  console.error('Missing dependency: socket.io-client');
  console.error('Install with: npm install -D socket.io-client');
  process.exit(1);
}

const HOST = process.env.WS_HOST ?? 'http://192.168.1.16:3000';
const PATH = process.env.WS_PATH ?? '/socket.io';
const EVENT = 'acknowledgeConversation';  // acknowledgeConversation
const PAYLOAD = { conversationId: 1 };
const TOTAL_EVENTS = Number(process.env.WS_TOTAL_EVENTS ?? 150);
const CONCURRENCY = Number(process.env.WS_CONCURRENCY ?? 25);
const TIMEOUT_MS = Number(process.env.WS_ACK_TIMEOUT_MS ?? 2500);
const COOKIE = "session=s%3AdZqKlMa91SYVV2cS1WRgMMha2lF1yas_.%2Flf25Avp3MevnIKJMUHCkStXi2gNpgGUYvTkwN%2FHi6g";
const TRANSPORT = process.env.WS_TRANSPORT ?? 'websocket';

if (!Number.isFinite(TOTAL_EVENTS) || TOTAL_EVENTS <= 0) {
  throw new Error('WS_TOTAL_EVENTS must be a positive number');
}
if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
  throw new Error('WS_CONCURRENCY must be a positive number');
}

const headers = COOKIE ? { Cookie: COOKIE } : undefined;

const socket = io(
  HOST,
  {
    path: PATH,
    withCredentials: true,
    extraHeaders: {
      "Cookie": COOKIE,
    }
});

let exceptionCount = 0;
let successCount = 0;
let errorCount = 0;
let completedCount = 0;
let emittedCount = 0;
let inFlight = 0;

const startedAt = Date.now();

socket.on('connect_error', (err) => {
  console.error('connect_error:', err?.message ?? err);
  process.exitCode = 1;
});

socket.on('exception', (payload) => {
  exceptionCount += 1;
  const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (msg.toLowerCase().includes('rate')) {
    // Helpful trace when throttling starts
    console.log('exception:', msg);
  }
});

socket.on('connect', () => {
  console.log(`Connected as ${socket.id} -> ${HOST}${PATH}`);
  pump();
});

function emitOnce() {
  inFlight += 1;
  emittedCount += 1;

  return new Promise((resolve) => {
    socket
      .timeout(TIMEOUT_MS)
      .emit(EVENT, PAYLOAD, (err, _response) => {
        if (err) {
          errorCount += 1;
        } else {
          successCount += 1;
        }

        completedCount += 1;
        inFlight -= 1;
        resolve();
      });
  });
}

async function pump() {
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    workers.push(
      (async () => {
        while (emittedCount < TOTAL_EVENTS) {
          await emitOnce();
        }
      })(),
    );
  }

  await Promise.all(workers);

  const durationMs = Date.now() - startedAt;
  console.log('--- WS rate-limit test report ---');
  console.log(`event=${EVENT}`);
  console.log(`payload=${JSON.stringify(PAYLOAD)}`);
  console.log(`totalRequested=${TOTAL_EVENTS}`);
  console.log(`completed=${completedCount}`);
  console.log(`successCount=${successCount}`);
  console.log(`ackErrorCount=${errorCount}`);
  console.log(`exceptionEventCount=${exceptionCount}`);
  console.log(`inFlightAtEnd=${inFlight}`);
  console.log(`durationMs=${durationMs}`);

  socket.close();
}
