export const AUTH_SESSION_COOKIE_NAME =
  process.env.AUTH_SESSION_COOKIE_NAME?.trim() || 'raffle_session';

export const AUTH_SESSION_TTL_DAYS = Number.parseInt(
  process.env.AUTH_SESSION_TTL_DAYS?.trim() || '30',
  10,
);

export const AUTH_SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
