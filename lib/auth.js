import { createHmac, pbkdf2Sync, randomBytes } from 'crypto';

const COOKIE_NAME   = 'axis_session';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h seconds

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET not set');
  return s;
}

function signToken(payload) {
  const data = JSON.stringify({ ...payload, iat: Date.now() });
  const b64  = Buffer.from(data).toString('base64url');
  const sig  = createHmac('sha256', secret()).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const b64 = token.slice(0, dot);
    const sig  = token.slice(dot + 1);
    const expected = createHmac('sha256', secret()).update(b64).digest('hex');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (Date.now() - payload.iat > COOKIE_MAX_AGE * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(req) {
  const cookie = req.cookies.get(COOKIE_NAME);
  return verifyToken(cookie?.value);
}

export function createSessionCookie(payload) {
  return {
    name: COOKIE_NAME,
    value: signToken(payload),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    },
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: { httpOnly: true, maxAge: 0, path: '/' },
  };
}

export function hashPassword(password, salt) {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function generateSalt() {
  return randomBytes(32).toString('hex');
}
