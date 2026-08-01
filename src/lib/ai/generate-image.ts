import { promises as fs } from "fs";
import path from "path";
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

/** Delete a local uploaded image if it lives under /uploads */
export async function deleteLocalUpload(imageUrl: string): Promise<boolean> {
  if (!imageUrl?.startsWith("/uploads/")) return false;
  const file = path.join(process.cwd(), "public", imageUrl);
  try {
    await fs.unlink(file);
    return true;
  } catch {
    return false;
  }
}
