import { createHmac, timingSafeEqual } from 'node:crypto';

export function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

export interface JwtClaims {
  sub?: string;
  role?: string;
  email?: string;
  name?: string;
  iss?: string;
  exp?: number;
  iat?: number;
}

export function signHs256(payload: JwtClaims, secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(
    JSON.stringify({ ...payload, iat: now, exp: payload.exp ?? now + 3600 }),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/** Returns decoded claims or null when the token is malformed/expired/bad signature. */
export function verifyHs256(token: string, secret: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as JwtClaims;
    if (
      typeof claims.exp === 'number' &&
      claims.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
