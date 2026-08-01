import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Red "WG" mark favicon for World Grid (Next.js app/icon.tsx). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c8102e",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        WG
      </div>
    ),
    { ...size },
  );
}
