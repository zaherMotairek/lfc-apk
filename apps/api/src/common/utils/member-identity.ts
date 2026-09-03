import { createHash, randomInt } from 'crypto';

export function generateOtpCode(length = 6) {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}

export function hashOtpCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export function normalizeMemberId(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, '');
  return normalized.length ? normalized : null;
}

export function normalizePhoneNumber(value?: string | null) {
  if (!value) {
    return null;
  }
  const digits = value.replace(/[^\d+]/g, '').trim();
  return digits.length ? digits : null;
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'Member', lastName: 'Unknown' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '-' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

/** Local part of an email — used as default login username (min 3 chars). */
export function emailLocalPart(email: string): string | null {
  const local = email.split('@')[0]?.trim().toLowerCase();
  if (!local || local.length < 3) {
    return null;
  }
  return local;
}
