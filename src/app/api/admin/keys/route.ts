import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  clearSecretField,
  getSecretsStatus,
  saveSecrets,
  type KeyFieldId,
} from "@/lib/secrets";

const FIELDS: KeyFieldId[] = [
  "geminiApiKey",
  "claudeApiKey",
  "anthropicApiKey",
  "grokApiKey",
];

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getSecretsStatus();
  return NextResponse.json({ status });
}

/** Save / update keys (non-empty values only). */
export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const patch: Partial<Record<KeyFieldId, string>> = {};

    for (const field of FIELDS) {
      if (field in body && body[field] != null && String(body[field]).trim()) {
        patch[field] = String(body[field]).trim();
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No keys to save. Paste a key value first." },
        { status: 400 },
      );
    }

    await saveSecrets(patch);
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
 */
export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const field = String(body.field || body.clear || "") as KeyFieldId;
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
