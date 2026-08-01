import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "wg_admin_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 hours (was 7 days — audit P0)

const DEV_PASSWORD = "admin123";
const DEV_SECRET = "worldgrid-dev-secret-change-me";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** True when running with insecure baked-in defaults (local only). */
export function isUsingDevAuthDefaults(): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  const sec = process.env.ADMIN_SECRET;
  return (
    (!pwd || pwd === DEV_PASSWORD) &&
    (!sec || sec === DEV_SECRET)
  );
}

/**
 * Fail closed in production if secrets are missing or still default.
 */
export function assertAuthConfig(): { ok: true } | { ok: false; error: string } {
  if (!isProduction()) return { ok: true };

  const pwd = process.env.ADMIN_PASSWORD?.trim();
  const sec = process.env.ADMIN_SECRET?.trim();

  if (!pwd || pwd === DEV_PASSWORD || pwd.length < 12) {
    return {
      ok: false,
      error:
        "Production requires ADMIN_PASSWORD (min 12 chars, not the dev default).",
    };
  }
  if (!sec || sec === DEV_SECRET || sec.length < 32) {
    return {
      ok: false,
      error:
        "Production requires ADMIN_SECRET (min 32 random chars, independent of password).",
    };
  }
  return { ok: true };
}

function secret(): string {
  if (isProduction()) {
    const sec = process.env.ADMIN_SECRET?.trim();
    if (!sec || sec === DEV_SECRET) {
      // Should never mint sessions without assertAuthConfig
      throw new Error("ADMIN_SECRET is not configured for production.");
    }
    return sec;
  }
  // Dev: prefer explicit secret, else password, else known local default
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    DEV_SECRET
  );
}

export function getAdminPassword(): string {
  if (isProduction()) {
    const pwd = process.env.ADMIN_PASSWORD?.trim();
    if (!pwd || pwd === DEV_PASSWORD) {
      throw new Error("ADMIN_PASSWORD is not configured for production.");
    }
    return pwd;
  }
  return process.env.ADMIN_PASSWORD?.trim() || DEV_PASSWORD;
}

export function shouldShowDevPasswordHint(): boolean {
  return !isProduction() && isUsingDevAuthDefaults();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Constant-time string compare for passwords. */
export function secureCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) {
      // Still do a compare to reduce length oracle slightly
      const pad = Buffer.alloc(Math.max(ba.length, bb.length));
      timingSafeEqual(
        Buffer.concat([ba, pad]).subarray(0, pad.length),
        Buffer.concat([bb, pad]).subarray(0, pad.length),
      );
      return false;
    }
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function createSessionToken(username = "admin"): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const nonce = randomBytes(8).toString("hex");
  const body = `${username}.${exp}.${nonce}`;
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  // username.exp.nonce.sig  OR legacy username.exp.sig
  const parts = token.split(".");
  if (parts.length === 4) {
    const [username, expStr, nonce, sig] = parts;
    if (!username || !expStr || !nonce || !sig) return false;
    const body = `${username}.${expStr}.${nonce}`;
    const expected = sign(body);
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    } catch {
      return false;
    }
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return true;
  }
  // Legacy 3-part tokens
  if (parts.length === 3) {
    const [username, expStr, sig] = parts;
    const body = `${username}.${expStr}`;
    const expected = sign(body);
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    } catch {
      return false;
    }
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return true;
  }
  return false;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    if (isProduction()) {
      const cfg = assertAuthConfig();
      if (!cfg.ok) return false;
    }
    const jar = await cookies();
    return verifySessionToken(jar.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  if (isProduction()) {
    const cfg = assertAuthConfig();
    if (!cfg.ok) throw new Error(cfg.error);
  }
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export { COOKIE_NAME, MAX_AGE_SEC };
