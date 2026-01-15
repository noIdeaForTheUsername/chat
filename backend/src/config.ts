const defaultJwtExpiration = '7d';
const defaultCookieExpirationMs = 7 * 24 * 60 * 60 * 1000; // 7 days

export default () => {
  const configObject = {

    app: {
      mode: process.env.NODE_ENV ?? 'development',
      port: parseInt(process.env.APP_PORT ?? "3000", 10) || 3000,
    },

    auth: {
      secret: process.env.AUTH_SECRET ?? "test secret",
      expiration: process.env.AUTH_EXPIRATION ?? defaultJwtExpiration,
    },

    cookies: {
      // if not explicitly set to 'false', then true because it is safer
      sameSite: process.env.COOKIES_SAME_SITE?.toLowerCase() ?? 'lax',
      httpOnly: process.env.COOKIES_HTTP_ONLY?.toLowerCase() !== 'false',
      secure: process.env.COOKIES_SECURE?.toLowerCase() !== 'false',
      expire_ms: process.env.COOKIES_EXPIRE_MS ? parseInt(process.env.COOKIES_EXPIRE_MS, 10) : defaultCookieExpirationMs,
    },

    cors: {
      origins: getCorsOrigins(),
    },

    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? "5432", 10) || 5432,
      username: process.env.DB_USERNAME ?? 'chat',
      password: process.env.DB_PASSWORD ?? 'chat',
      database: process.env.DB_DATABASE ?? 'chat',
    },
  }

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
  if (!process.env.AUTH_EXPIRATION) {
    console.warn(getErrorMsg("AUTH_EXPIRATION", `a desired session expiration time like '12h' (currently falling back to '${defaultJwtExpiration}' by default)`));
  }
  if (!process.env.COOKIES_SAME_SITE) {
    throw new Error(getErrorMsg("COOKIES_SAME_SITE", "'strict', 'lax' or 'none'"));
  }
  if (!process.env.COOKIES_HTTP_ONLY) {
    throw new Error(getErrorMsg("COOKIES_HTTP_ONLY", "'true' (recommended) or 'false'"));
  }
  if (!process.env.COOKIES_SECURE) {
    throw new Error(getErrorMsg("COOKIES_SECURE", "'true' (recommended) or 'false'"));
  }

  return configObject;
}

function getErrorMsg(variable_name: string, allowed_values_hint: string) {
  return `${variable_name} is not defined in environment variables. Set it to ${allowed_values_hint} for production environments (important for security).`;
}

function parseList(val?: string): string[] | undefined {
  if (!val) return undefined;
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

export function getCorsOrigins() {
  return parseList(process.env.CORS_ALLOWED_ORIGINS) ?? [
    "http://localhost:8100",
    "http://192.168.1.2:8100",
    "http://chmuraim.dynv6.net:8100",
    "http://46.205.222.219:8100"
  ];
}