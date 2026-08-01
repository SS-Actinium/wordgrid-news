import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSecretsStatus } from "@/lib/secrets";
import { KeysForm } from "./KeysForm";

export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const status = await getSecretsStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-news-ink dark:text-white">
          AI API keys
        </h1>
        <p className="mt-1 text-sm text-news-muted">
          <strong className="text-news-red">Gemini is required</strong> for
          image generation. Claude / Anthropic / Grok are optional for text.
          Use <strong>Clear stored key</strong> to remove keys saved in the
          app. Env-only keys must be removed from{" "}
          <code className="text-xs">.env.local</code>.
        </p>
      </div>
      <KeysForm status={status} />
    </div>
  );
}
