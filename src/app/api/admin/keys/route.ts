import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  clearSecretField,
  getSecretsStatus,
  saveSecrets,
  type KeyFieldId,
} from "@/lib/secrets";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";
import { keysDeleteSchema, keysPutSchema } from "@/lib/validation";

const FIELDS: KeyFieldId[] = [
  "geminiApiKey",
  "claudeApiKey",
  "anthropicApiKey",
  "grokApiKey",
];

function forbiddenOrigin() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * GET returns masked status only (configured/stored/hint) — never full secrets.
 * Aligns with getSecretsStatus() in src/lib/secrets.ts.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getSecretsStatus();
  return NextResponse.json({ status });
}

/** Save / update keys (non-empty values only). Response is status-only (masked). */
export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return forbiddenOrigin();
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `admin-keys-put:${ip}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Key update rate limit. Retry in ${limited.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const raw = await req.json();
    const parsed = keysPutSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const patch: Partial<Record<KeyFieldId, string>> = {};
    for (const field of FIELDS) {
      const value = parsed.data[field];
      if (value) patch[field] = value;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No keys to save. Paste a key value first." },
        { status: 400 },
      );
    }

    await saveSecrets(patch);
    // Never return raw secrets — status masks to last-4 hint only
    const status = await getSecretsStatus();
    return NextResponse.json({
      ok: true,
      status,
      message: status.geminiReady
        ? "Keys saved. Gemini is ready for image generation."
        : "Keys saved. Warning: Gemini is still missing — image generation will not work.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 400 },
    );
  }
}

/**
 * Clear one stored key.
 * Body: { field: "geminiApiKey" } or { clear: "geminiApiKey" }
 * Response includes status only (masked); clearSecretField never echoes keys.
 */
export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return forbiddenOrigin();
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `admin-keys-delete:${ip}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Key clear rate limit. Retry in ${limited.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = keysDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: `Invalid field. Use one of: ${FIELDS.join(", ")}`,
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const field = (parsed.data.field || parsed.data.clear) as KeyFieldId;
    if (!FIELDS.includes(field)) {
      return NextResponse.json(
        {
          error: `Invalid field. Use one of: ${FIELDS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const result = await clearSecretField(field);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clear failed" },
      { status: 400 },
    );
  }
}
