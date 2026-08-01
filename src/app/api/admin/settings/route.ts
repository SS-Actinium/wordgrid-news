import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { sanitizeHttpUrl } from "@/lib/sanitize";
import { getSettings, saveSettings } from "@/lib/store";
import type { SiteSeoSettings, SiteSettings } from "@/lib/types";
import { settingsPutSchema } from "@/lib/validation";

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
    const raw = await req.json();
    const parsed = settingsPutSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const current = await getSettings();
    const patch: Partial<SiteSettings> = {};

    if (body.homepageLayout) {
      patch.homepageLayout = body.homepageLayout;
    }
    if (body.autoSyncEnabled != null) {
      patch.autoSyncEnabled = body.autoSyncEnabled;
    }
    if (body.autoSyncIntervalMinutes != null) {
      patch.autoSyncIntervalMinutes = body.autoSyncIntervalMinutes;
    }
    if (body.siteName) patch.siteName = body.siteName;
    if (body.tagline != null) patch.tagline = body.tagline;
    if (body.defaultAiProvider) {
      patch.defaultAiProvider = body.defaultAiProvider;
    }
    if (body.seo && typeof body.seo === "object") {
      const seoIn = body.seo;
      const nextSeo: SiteSeoSettings = {
        ...(current.seo as SiteSeoSettings),
      };

      if (seoIn.defaultMetaTitle != null) {
        nextSeo.defaultMetaTitle = seoIn.defaultMetaTitle;
      }
      if (seoIn.defaultMetaDescription != null) {
        nextSeo.defaultMetaDescription = seoIn.defaultMetaDescription;
      }
      if (seoIn.twitterHandle != null) {
        nextSeo.twitterHandle = seoIn.twitterHandle;
      }
      if (seoIn.googleSiteVerification != null) {
        nextSeo.googleSiteVerification = seoIn.googleSiteVerification;
      }
      if (seoIn.bingSiteVerification != null) {
        nextSeo.bingSiteVerification = seoIn.bingSiteVerification;
      }
      if (seoIn.organizationName != null) {
        nextSeo.organizationName = seoIn.organizationName;
      }
      if (seoIn.robotsIndex != null) {
        nextSeo.robotsIndex = seoIn.robotsIndex;
      }

      // Only http(s) for image URLs; empty string clears override to blank
      if (seoIn.defaultOgImage != null) {
        const cleaned = sanitizeHttpUrl(seoIn.defaultOgImage);
        nextSeo.defaultOgImage =
          cleaned ||
          (seoIn.defaultOgImage.startsWith("/uploads/")
            ? seoIn.defaultOgImage.slice(0, 2000)
            : seoIn.defaultOgImage.trim() === ""
              ? ""
              : current.seo?.defaultOgImage || "");
      }
      if (seoIn.organizationLogo != null) {
        const cleaned = sanitizeHttpUrl(seoIn.organizationLogo);
        nextSeo.organizationLogo =
          cleaned ||
          (seoIn.organizationLogo.startsWith("/uploads/")
            ? seoIn.organizationLogo.slice(0, 2000)
            : seoIn.organizationLogo.trim() === ""
              ? ""
              : current.seo?.organizationLogo || "");
      }

      patch.seo = nextSeo;
    }

    const settings = await saveSettings(patch);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
