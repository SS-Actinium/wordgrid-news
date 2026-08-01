import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/store";
import type { AiProviderId, HomepageLayout, SiteSeoSettings } from "@/lib/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const current = await getSettings();
    const patch: Record<string, unknown> = {};
    if (body.homepageLayout) {
      patch.homepageLayout = body.homepageLayout as HomepageLayout;
    }
    if (body.autoSyncEnabled != null) {
      patch.autoSyncEnabled = Boolean(body.autoSyncEnabled);
    }
    if (body.autoSyncIntervalMinutes != null) {
      patch.autoSyncIntervalMinutes = Math.max(
        5,
        Number(body.autoSyncIntervalMinutes) || 30,
      );
    }
    if (body.siteName) patch.siteName = String(body.siteName);
    if (body.tagline) patch.tagline = String(body.tagline);
    if (body.defaultAiProvider) {
      patch.defaultAiProvider = body.defaultAiProvider as AiProviderId;
    }
    if (body.seo && typeof body.seo === "object") {
      patch.seo = {
        ...(current.seo || {}),
        ...(body.seo as Partial<SiteSeoSettings>),
      };
    }
    const settings = await saveSettings(patch);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

