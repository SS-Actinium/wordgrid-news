import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "figure",
  "figcaption",
  "span",
  "div",
  "pre",
  "code",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "class",
  "width",
  "height",
];

/** Sanitize rich HTML from classic editor for safe storage/render. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty?.trim()) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Force safe links
    ADD_ATTR: ["target", "rel"],
  });
}

/** Sanitize a single content block (plain or HTML). */
export function sanitizeContentBlock(block: string): string {
  const b = block?.trim() || "";
  if (!b) return "";
  if (/^<[a-z]/i.test(b)) {
    return sanitizeHtml(b);
  }
  // Plain text — escape by wrapping via sanitizer
  return DOMPurify.sanitize(b, { ALLOWED_TAGS: [] });
}

export function sanitizeContentBlocks(blocks: string[]): string[] {
  return blocks.map(sanitizeContentBlock).filter(Boolean);
}

/** Only allow http(s) URLs for source/canonical links. */
export function sanitizeHttpUrl(url: string | undefined | null): string {
  if (!url?.trim()) return "";
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

/**
 * Accept only `/uploads/<basename>` for local image storage (SEC-14).
 * Same rules as deleteLocalUpload: no `..`, no `\`, no null bytes,
 * single path segment, filename must match `^[\w.-]+$`.
 * Returns normalized `/uploads/<basename>` or empty string.
 */
export function sanitizeLocalUploadPath(
  url: string | undefined | null,
): string {
  if (!url || typeof url !== "string") return "";
  const imageUrl = url.trim();
  if (
    !imageUrl.startsWith("/uploads/") ||
    imageUrl.includes("..") ||
    imageUrl.includes("\0") ||
    imageUrl.includes("\\")
  ) {
    return "";
  }

  const relative = imageUrl.slice("/uploads/".length);
  // Single segment only (basename === full relative path)
  if (!relative || relative.includes("/")) return "";
  if (!/^[\w.-]+$/i.test(relative)) return "";

  return `/uploads/${relative}`;
}

/** Escape JSON for embedding in <script type="application/ld+json"> */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
