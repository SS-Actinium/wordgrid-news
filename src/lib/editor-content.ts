import { sanitizeContentBlock, sanitizeHtml } from "./sanitize";

/** Convert stored paragraphs (plain or HTML fragments) into classic-editor HTML. */
export function paragraphsToHtml(paragraphs: string[]): string {
  if (!paragraphs?.length) return "";
  return paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (/^<(p|h[1-6]|ul|ol|blockquote|div|table)\b/i.test(p)) {
        return sanitizeHtml(p);
      }
      if (/<\/?(p|h[1-6]|ul|ol|li|blockquote)\b/i.test(p) && p.includes("</")) {
        return sanitizeHtml(p);
      }
      return `<p>${escapeHtml(p)}</p>`;
    })
    .join("\n");
}

/** Convert classic-editor HTML into content[] for storage. */
export function htmlToParagraphs(html: string): string[] {
  const raw = sanitizeHtml((html || "").trim());
  if (!raw) return [];

  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(
        `<div id="root">${raw}</div>`,
        "text/html",
      );
      const root = doc.getElementById("root");
      if (root) {
        const blocks: string[] = [];
        const walk = (el: Element) => {
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
              const t = child.textContent?.trim();
              if (t) blocks.push(t);
              continue;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) continue;
            const node = child as Element;
            const tag = node.tagName.toLowerCase();
            if (
              ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(
                tag,
              )
            ) {
              const inner = node.innerHTML.trim();
              if (inner) {
                const text = node.textContent?.trim() || "";
                const hasInline =
                  /<(strong|em|b|i|a|u|span|br)\b/i.test(inner);
                const block = hasInline
                  ? sanitizeHtml(`<${tag}>${inner}</${tag}>`)
                  : text;
                if (block) blocks.push(block);
              }
            } else if (tag === "ul" || tag === "ol") {
              blocks.push(sanitizeHtml(node.outerHTML));
            } else if (tag === "div" || tag === "section") {
              walk(node);
            } else {
              const t = node.textContent?.trim();
              if (t) blocks.push(t);
            }
          }
        };
        walk(root);
        if (blocks.length) return blocks.map(sanitizeContentBlock).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }

  return raw
    .replace(/<\/(p|h[1-6]|blockquote|div|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render content blocks safely for public pages (always sanitized). */
export function contentBlocksToHtml(content: string[]): string {
  return content
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      if (/^<(p|h[1-6]|ul|ol|blockquote|div|table)\b/i.test(b)) {
        return sanitizeHtml(b);
      }
      return `<p>${escapeHtml(b)}</p>`;
    })
    .join("\n");
}

/** Plain-text extraction for SEO word counts. */
export function contentToPlainText(content: string | string[]): string {
  const html = Array.isArray(content)
    ? contentBlocksToHtml(content)
    : sanitizeHtml(content);
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
