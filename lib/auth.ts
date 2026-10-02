import crypto from 'crypto';

const COOKIE_NAME = 'vishakahu_admin_token';
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

// Use a secure fallback or the configured admin password as secret
function getSecret(): string {
  return process.env.ADMIN_PASS || process.env.ADMIN_SECRET || 'vishakahu-secure-session-key-salt-2026';
}

/**
 * Creates an HMAC-SHA256 signature for a given payload string.
 */
function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/**
 * Generates a signed, timestamped session token.
 * Format: <username>.<timestamp>.<signature>
 */
export function createSessionToken(username: string): string {
  const timestamp = Date.now().toString();
  const data = `${username}.${timestamp}`;
  const signature = sign(data);
  return `${data}.${signature}`;
}

/**
 * Verifies the validity, signature, and expiration of a session token.
 */
export function verifySessionToken(token: string | null | undefined): { valid: boolean; username?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [username, timestampStr, signature] = parts;
  const data = `${username}.${timestampStr}`;
  const expectedSignature = sign(data);

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false };
  }

  // Check expiration (12 hours)
  const ageSeconds = (Date.now() - timestamp) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_DURATION_SECONDS) {
    return { valid: false };
  }

  return { valid: true, username };
}

export { COOKIE_NAME, SESSION_DURATION_SECONDS };
