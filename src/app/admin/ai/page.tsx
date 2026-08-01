import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSecretsStatus, statusToBooleans } from "@/lib/secrets";
import { getSettings } from "@/lib/store";
import { AiNewsStudio } from "./AiNewsStudio";

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const [fullStatus, settings] = await Promise.all([
    getSecretsStatus(),
    getSettings(),
  ]);
  const status = statusToBooleans(fullStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-news-ink dark:text-white">
          AI News Studio
        </h1>
        <p className="mt-1 text-sm text-news-muted">
          Write with Gemini, Claude / Anthropic, or Grok.{" "}
          <strong className="text-news-ink dark:text-white">
            Gemini API key is mandatory
          </strong>{" "}
          for hero image generation. Then save as draft or publish.
        </p>
      </div>
      {!status.gemini && (
        <div className="border border-news-red bg-news-red-soft p-4 text-sm text-news-red-dark dark:bg-news-red/10 dark:text-red-200">
          <p className="font-bold">Gemini key required</p>
          <p className="mt-1">
            Add your Gemini API key before generating images.{" "}
            <Link href="/admin/keys" className="font-bold underline">
              Open AI Keys →
            </Link>
          </p>
        </div>
      )}
      <AiNewsStudio
        keyStatus={status}
        defaultProvider={settings.defaultAiProvider || "gemini"}
      />
    </div>
  );
}
