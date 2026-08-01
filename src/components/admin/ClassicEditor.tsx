"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor as TinyMCEEditor } from "tinymce";

// Self-hosted TinyMCE (WordPress Classic uses TinyMCE)
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/preview";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";
import "tinymce/skins/ui/oxide/skin.min.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  height?: number;
  disabled?: boolean;
};

/**
 * WordPress Classic Editor–style body field (TinyMCE visual + text tabs).
 */
export function ClassicEditor({
  value,
  onChange,
  height = 420,
  disabled,
}: Props) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const [textValue, setTextValue] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keep text tab in sync when switching from visual
  useEffect(() => {
    if (mode === "text") setTextValue(value);
  }, [mode, value]);

  const init = useMemo(
    () => ({
      height,
      menubar: true,
      branding: false,
      promotion: false,
      skin: false as const,
      content_css: false as const,
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "charmap",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "media",
        "table",
        "preview",
        "wordcount",
      ],
      toolbar:
        "undo redo | styles | bold italic underline strikethrough | " +
        "alignleft aligncenter alignright alignjustify | " +
        "bullist numlist outdent indent | blockquote | " +
        "link image media table | removeformat | code fullscreen",
      menubar_mode: "wrap" as const,
      style_formats: [
        { title: "Paragraph", format: "p" },
        { title: "Heading 2", format: "h2" },
        { title: "Heading 3", format: "h3" },
        { title: "Heading 4", format: "h4" },
        { title: "Blockquote", format: "blockquote" },
        { title: "Preformatted", format: "pre" },
      ],
      content_style: `
        body {
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size: 16px;
          line-height: 1.7;
          color: #1a1a1a;
          padding: 12px 16px;
          max-width: 100%;
        }
        p { margin: 0 0 1em; }
        h2, h3, h4 { font-family: Georgia, serif; margin: 1.2em 0 0.5em; }
        blockquote {
          border-left: 4px solid #e31c25;
          margin: 1em 0;
          padding: 0.25em 0 0.25em 1em;
          color: #444;
          font-style: italic;
        }
        a { color: #e31c25; }
        img { max-width: 100%; height: auto; }
      `,
      image_title: true,
      automatic_uploads: false,
      file_picker_types: "image",
      // Paste plain URLs as links
      link_default_target: "_blank",
      convert_urls: false,
      entity_encoding: "raw" as const,
      resize: true as const,
      statusbar: true,
      elementpath: true,
    }),
    [height],
  );

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center border border-[#c3c4c7] bg-[#f0f0f1] text-sm text-[#50575e]"
        style={{ height }}
      >
        Loading classic editor…
      </div>
    );
  }

  return (
    <div className="wp-classic-editor overflow-hidden rounded-sm border border-[#c3c4c7] bg-white shadow-sm">
      {/* WordPress-style Visual / Text tabs */}
      <div className="flex items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7]">
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              if (mode === "text" && editorRef.current) {
                editorRef.current.setContent(textValue);
                onChange(textValue);
              }
              setMode("visual");
            }}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "visual"
                ? "border-b-2 border-[#2271b1] bg-white text-[#1d2327]"
                : "text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => {
              const html =
                editorRef.current?.getContent() ?? value;
              setTextValue(html);
              onChange(html);
              setMode("text");
            }}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "text"
                ? "border-b-2 border-[#2271b1] bg-white text-[#1d2327]"
                : "text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            Text
          </button>
        </div>
        <span className="pr-3 text-[11px] font-medium uppercase tracking-wide text-[#787c82]">
          Classic Editor
        </span>
      </div>

      {mode === "visual" ? (
        <Editor
          licenseKey="gpl"
          value={value}
          disabled={disabled}
          onInit={(_evt, editor) => {
            editorRef.current = editor;
          }}
          onEditorChange={(html) => onChange(html)}
          init={init}
        />
      ) : (
        <textarea
          value={textValue}
          disabled={disabled}
          onChange={(e) => {
            setTextValue(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full resize-y border-0 bg-[#f6f7f7] p-4 font-mono text-sm text-[#1d2327] outline-none"
          style={{ minHeight: height, height }}
          spellCheck={false}
        />
      )}

      <div className="border-t border-[#c3c4c7] bg-[#f6f7f7] px-3 py-1.5 text-[11px] text-[#646970]">
        Tip: Use the toolbar for headings, bold, lists, links, and images — same
        flow as WordPress Classic.
      </div>
    </div>
  );
}
