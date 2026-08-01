import { promises as fs } from "fs";
import path from "path";
import type { AiProviderId, ApiSecrets } from "./types";

const SECRETS_FILE = path.join(process.cwd(), "data", "secrets.json");

const EMPTY: ApiSecrets = {};

export type KeyFieldId =
  | "geminiApiKey"
  | "claudeApiKey"
  | "anthropicApiKey"
  | "grokApiKey";

export type KeyFieldStatus = {
  /** Can make API calls (stored OR env) */
  configured: boolean;
  /** Key exists in data/secrets.json */
  stored: boolean;
  /** Key available from environment */
  fromEnv: boolean;
  /** Clear button should work (only when stored) */
  canClear: boolean;
  /** Short human label for source */
  sourceLabel: "stored" | "env" | "stored+env" | "not set";
  /** Last 4 chars of stored key for admin confirmation (never full key) */
  storedHint: string | null;
};

export type SecretsStatus = {
  gemini: KeyFieldStatus;
  claude: KeyFieldStatus;
  anthropic: KeyFieldStatus;
  grok: KeyFieldStatus;
  /** Any usable Gemini path (stored or env) — required for images */
  geminiReady: boolean;
  updatedAt: string | null;
};

async function ensureDir() {
  await fs.mkdir(path.dirname(SECRETS_FILE), { recursive: true });
}

function hintFromKey(value?: string): string | null {
  const v = value?.trim();
  if (!v || v.length < 4) return v ? "••••" : null;
  return `…${v.slice(-4)}`;
}

function fieldStatus(storedVal?: string, envVal?: string): KeyFieldStatus {
  const stored = Boolean(storedVal?.trim());
  const fromEnv = Boolean(envVal?.trim());
  let sourceLabel: KeyFieldStatus["sourceLabel"] = "not set";
  if (stored && fromEnv) sourceLabel = "stored+env";
  else if (stored) sourceLabel = "stored";
  else if (fromEnv) sourceLabel = "env";

  return {
    configured: stored || fromEnv,
    stored,
    fromEnv,
    canClear: stored,
    sourceLabel,
    storedHint: hintFromKey(storedVal),
  };
}

export async function getSecrets(): Promise<ApiSecrets> {
  try {
    const raw = await fs.readFile(SECRETS_FILE, "utf8");
    const parsed = JSON.parse(raw) as ApiSecrets;
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeSecrets(secrets: ApiSecrets): Promise<void> {
  await ensureDir();
  const clean: ApiSecrets = { ...secrets, updatedAt: new Date().toISOString() };
  // Drop empty strings
  for (const k of Object.keys(clean) as (keyof ApiSecrets)[]) {
    if (k === "updatedAt") continue;
    const v = clean[k];
    if (typeof v === "string" && !v.trim()) {
      delete clean[k];
    }
  }
  await fs.writeFile(SECRETS_FILE, JSON.stringify(clean, null, 2), "utf8");
}

/** Merge patch into secrets. Empty string = clear that field from storage. */
export async function saveSecrets(
  patch: Partial<ApiSecrets>,
): Promise<ApiSecrets> {
  const current = await getSecrets();
  const next: ApiSecrets = { ...current };

  for (const key of Object.keys(patch) as (keyof ApiSecrets)[]) {
    if (key === "updatedAt") continue;
    const value = patch[key];
    if (value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") {
      delete next[key];
    } else if (typeof value === "string") {
      next[key] = value.trim();
    }
  }

  await writeSecrets(next);
  return getSecrets();
}

/**
 * Clear one stored key field. Always allowed for stored values.
 * Env-only keys cannot be cleared here (return ok:false with reason).
 */
export async function clearSecretField(field: KeyFieldId): Promise<{
  ok: boolean;
  cleared: boolean;
  message: string;
  status: SecretsStatus;
}> {
  const current = await getSecrets();
  const hadStored = Boolean(current[field]?.trim());

  if (!hadStored) {
    const status = await getSecretsStatus();
    const stillConfigured =
      field === "geminiApiKey"
        ? status.gemini.configured
        : field === "claudeApiKey"
          ? status.claude.configured
          : field === "anthropicApiKey"
            ? status.anthropic.configured
            : status.grok.configured;

    return {
      ok: true,
      cleared: false,
      message: stillConfigured
        ? "No key stored in the app. This provider is still available from an environment variable — remove it from .env.local to fully disable."
        : "Nothing to clear — this key was not stored.",
      status,
    };
  }

  delete current[field];
  await writeSecrets(current);
  const status = await getSecretsStatus();

  let message = `Cleared stored ${field.replace("ApiKey", "")} key.`;
  if (field === "geminiApiKey" && !status.geminiReady) {
    message +=
      " Gemini is no longer available — image generation will fail until you add a key again.";
  } else if (field === "geminiApiKey" && status.gemini.fromEnv) {
    message +=
      " Gemini is still available via GEMINI_API_KEY in the environment.";
  }

  return { ok: true, cleared: true, message, status };
}

export async function resolveProviderKey(
  provider: AiProviderId,
): Promise<string | null> {
  const s = await getSecrets();
  switch (provider) {
    case "gemini":
      return (
        s.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || null
      );
    case "claude":
      return (
        s.claudeApiKey?.trim() ||
        s.anthropicApiKey?.trim() ||
        process.env.ANTHROPIC_API_KEY?.trim() ||
        null
      );
    case "anthropic":
      return (
        s.anthropicApiKey?.trim() ||
        s.claudeApiKey?.trim() ||
        process.env.ANTHROPIC_API_KEY?.trim() ||
        null
      );
    case "grok":
      return (
        s.grokApiKey?.trim() ||
        process.env.XAI_API_KEY?.trim() ||
        process.env.GROK_API_KEY?.trim() ||
        null
      );
    default:
      return null;
  }
}

export async function hasGeminiKey(): Promise<boolean> {
  return Boolean(await resolveProviderKey("gemini"));
}

export async function requireGeminiKey(): Promise<string> {
  const key = await resolveProviderKey("gemini");
  if (!key?.trim()) {
    throw new Error(
      "Gemini API key is required for image generation. Add it in Admin → AI Keys (or set GEMINI_API_KEY).",
    );
  }
  return key;
}

export async function getSecretsStatus(): Promise<SecretsStatus> {
  const s = await getSecrets();
  const gemini = fieldStatus(s.geminiApiKey, process.env.GEMINI_API_KEY);
  const claude = fieldStatus(s.claudeApiKey, process.env.ANTHROPIC_API_KEY);
  const anthropic = fieldStatus(
    s.anthropicApiKey,
    process.env.ANTHROPIC_API_KEY,
  );
  const grok = fieldStatus(
    s.grokApiKey,
    process.env.XAI_API_KEY || process.env.GROK_API_KEY,
  );

  return {
    gemini,
    claude,
    anthropic,
    grok,
    geminiReady: gemini.configured,
    updatedAt: s.updatedAt || null,
  };
}

/** Back-compat helper for UIs that still expect boolean flags */
export function statusToBooleans(status: SecretsStatus) {
  return {
    gemini: status.gemini.configured,
    claude: status.claude.configured,
    anthropic: status.anthropic.configured,
    grok: status.grok.configured,
    geminiMandatoryOk: status.geminiReady,
    updatedAt: status.updatedAt,
  };
}
