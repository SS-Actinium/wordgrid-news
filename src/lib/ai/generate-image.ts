import { promises as fs } from "fs";
import path from "path";
import { sanitizeLocalUploadPath } from "../sanitize";
import { requireGeminiKey } from "../secrets";

export type GenerateImageResult = {
  imageUrl: string;
  mimeType: string;
  provider: "gemini";
};

/**
 * Generate an article hero image via Gemini image-capable models.
 * Gemini API key is mandatory.
 */
export async function generateArticleImage(
  prompt: string,
  options?: { articleTitle?: string },
): Promise<GenerateImageResult> {
  const apiKey = await requireGeminiKey();

  const fullPrompt = [
    "Create a high-quality editorial news photograph style image, cinematic lighting, no text overlays, no watermarks, photorealistic.",
    options?.articleTitle ? `Story: ${options.articleTitle}` : "",
    `Scene: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const model =
    process.env.GEMINI_IMAGE_MODEL ||
    "gemini-2.0-flash-preview-image-generation";

  // SEC-10: API key in header only — never in URL query (logs/proxies)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!res.ok) {
    // Fallback model attempt
    const fallbackModel = "gemini-2.0-flash-exp-image-generation";
    if (model !== fallbackModel) {
      return generateWithModel(apiKey, fallbackModel, fullPrompt);
    }
    const err = await res.text();
    throw new Error(
      `Gemini image error: ${res.status} ${err.slice(0, 400)}. Ensure your key has image generation access.`,
    );
  }

  return extractAndSaveImage(await res.json(), "gemini");
}

async function generateWithModel(
  apiKey: string,
  model: string,
  fullPrompt: string,
): Promise<GenerateImageResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Gemini image error: ${res.status} ${err.slice(0, 400)}. Ensure image generation is enabled for your Gemini API key.`,
    );
  }
  return extractAndSaveImage(await res.json(), "gemini");
}

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }[];
    };
  }[];
};

async function extractAndSaveImage(
  json: GeminiResponse,
  provider: "gemini",
): Promise<GenerateImageResult> {
  const parts = json.candidates?.[0]?.content?.parts || [];
  let b64: string | undefined;
  let mime = "image/png";

  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      b64 = inline.data;
      mime =
        ("mimeType" in inline && inline.mimeType) ||
        ("mime_type" in inline && inline.mime_type) ||
        mime;
      break;
    }
  }

  if (!b64) {
    throw new Error(
      "Gemini returned no image data. Try a different image model or prompt.",
    );
  }

  const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  const fileName = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, Buffer.from(b64, "base64"));

  return {
    imageUrl: `/uploads/${fileName}`,
    mimeType: mime,
    provider,
  };
}

/**
 * Delete a local uploaded image only if it resolves under public/uploads
 * (audit HIGH-05 path traversal fix; reuses sanitizeLocalUploadPath / SEC-14).
 */
export async function deleteLocalUpload(imageUrl: string): Promise<boolean> {
  const safe = sanitizeLocalUploadPath(imageUrl);
  if (!safe) return false;

  const base = safe.slice("/uploads/".length);
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const resolved = path.resolve(uploadsRoot, base);
  if (
    resolved !== uploadsRoot &&
    !resolved.startsWith(uploadsRoot + path.sep)
  ) {
    return false;
  }

  try {
    await fs.unlink(resolved);
    return true;
  } catch {
    return false;
  }
}
