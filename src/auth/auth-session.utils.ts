import { CookieOptions } from 'express';
import { AUTH_SESSION_COOKIE_NAME } from './auth-session.constants';

export function getCookieValue(
  cookieHeader: string | string[] | undefined,
  cookieName = AUTH_SESSION_COOKIE_NAME,
) {
  if (!cookieHeader) {
    return null;
  }

  const rawValue = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  const cookieParts = rawValue.split(';');

  for (const cookiePart of cookieParts) {
    const [name, ...valueParts] = cookiePart.trim().split('=');

    if (name === cookieName) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

export function getSessionCookieOptions(expiresAt: Date): CookieOptions {
  const secure = isSecureCookieEnabled();

  return {
    httpOnly: true,
    secure,
    // Telegram Mini Apps run in a cross-site context, so secure deployments
    // need SameSite=None or the browser will drop the session cookie on API calls.
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    expires: expiresAt,
  };
}

export function getClearedSessionCookieOptions(): CookieOptions {
  return {
    ...getSessionCookieOptions(new Date(0)),
    expires: new Date(0),
    maxAge: 0,
  };
}

function isSecureCookieEnabled() {
  const configured = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (configured === 'true') {
    return true;
  }

  if (configured === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'development';
}
