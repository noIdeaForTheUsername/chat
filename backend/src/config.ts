import ms from "ms";

// default vals
let inactiveSessionExpiration = ms('14d');
let absoluteSessionExpiration = ms('60d');

export default () => {
  try {
    inactiveSessionExpiration = ms(process.env.INACTIVE_SESSION_EXPIRATION as any) as any as number;
    absoluteSessionExpiration = ms(process.env.ABSOLUTE_SESSION_EXPIRATION as any) as any as number;
  } catch (error) {
    throw new Error(`Error parsing INACTIVE_SESSION_EXPIRATION or ABSOLUTE_SESSION_EXPIRATION .env variables.
      Input correct values of session lifetimes, like '14d'. Error details: `, error);
  }

  const configObject = {
    app: {
      mode: process.env.NODE_ENV ?? 'development',
      port: parseInt(process.env.APP_PORT ?? "3000", 10) || 3000,
    },

    auth: {
      secret: process.env.AUTH_SECRET ?? "test secret",
      inactiveExpiration: inactiveSessionExpiration,
      absoluteExpiration: absoluteSessionExpiration,
      requireAccountActivation: process.env.REQUIRE_ACCOUNT_ACTIVATION?.toLowerCase() === 'true',
    },


    cookies: {
      // if not explicitly set to 'false', then true because it is safer
      sameSite: process.env.COOKIES_SAME_SITE?.toLowerCase() ?? 'lax',
      httpOnly: process.env.COOKIES_HTTP_ONLY?.toLowerCase() !== 'false',
      secure: process.env.COOKIES_SECURE?.toLowerCase() !== 'false',
    },

    cors: {
      origins: getCorsOrigins(),
    },

    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? "5432", 10) || 5432,
      username: process.env.DB_USERNAME ?? 'chat',
      password: process.env.DB_PASSWORD ?? 'chat',
      database: process.env.DB_NAME ?? 'chat',
    },

    pushNotifications: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? null,
      vapidContact: process.env.VAPID_CONTACT ?? '',
    }
  }

  console.log("Inactive expiration: ", configObject?.auth?.inactiveExpiration);
  console.log("Absolute expiration: ", configObject?.auth?.absoluteExpiration);

  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "production") {
    throw new Error("NODE_ENV is set to an invalid value. Allowed values are 'development' and 'production'.");
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("Warning: Application is running in development mode. Change the NODE_ENV to 'production' for production environments (security-critical).");
    return configObject;
  }

  // Further validation only for production mode

  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not defined in environment variables. Please generate a strong secret, set it in .ENV and keep it safe");
  }
  if (!process.env.INACTIVE_SESSION_EXPIRATION) {
    console.warn(getErrorMsg("INACTIVE_SESSION_EXPIRATION", `a desired session expiration time like '3600' (currently falling back to '${inactiveSessionExpiration}' by default)`));
  }
  if (!process.env.ABSOLUTE_SESSION_EXPIRATION) {
    console.warn(getErrorMsg("ABSOLUTE_SESSION_EXPIRATION", `a desired session expiration time like '3600' (currently falling back to '${absoluteSessionExpiration}' by default)`));
  }

  if (!process.env.COOKIES_SAME_SITE) {
    throw new Error(getErrorMsg("COOKIES_SAME_SITE", "'strict', 'lax' or 'none'"));
  }
  if (configObject.cookies.sameSite == 'none') {
    console.error(`COOKIES_SAME_SITE set to 'none'. I'm telling you that this is a bad idea.
      But if you're going for it, please be aware: CORS allows ALL connections in websockets (all files .gateway.ts). This leaves a criticial vulnerability with cookies set to 'none'.
      For some reason, CORS in @WebSocketGateway cannot use the .env config no matter what I do, so you have to: find each .gateway file, and manually change "origin: YOUR_FRONTEND_URL" there.`);
  }
  if (!process.env.COOKIES_HTTP_ONLY) {
    throw new Error(getErrorMsg("COOKIES_HTTP_ONLY", "'true' (recommended) or 'false'"));
  }
  if (!process.env.COOKIES_SECURE) {
    throw new Error(getErrorMsg("COOKIES_SECURE", "'true' (recommended) or 'false'"));
  }

  if (
    !configObject.pushNotifications.vapidPublicKey
    || !configObject.pushNotifications.vapidPrivateKey
    || !configObject.pushNotifications.vapidContact
  ) {
    console.warn("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_CONTACT are not all set in environment variables. The push notifications will be disabled.");
  }

  return configObject;
}

function getErrorMsg(variable_name: string, allowed_values_hint: string) {
  return `${variable_name} is not defined in environment variables. Set it to ${allowed_values_hint} for production environments.`;
}

function parseList(val?: string): string[] | undefined {
  if (!val) return undefined;
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

export function getCorsOrigins() {
  return parseList(process.env.CORS_ALLOWED_ORIGINS);
}
