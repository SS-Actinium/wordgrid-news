import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/store";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-news-ink dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-news-muted">
          Homepage layout skins, auto-sync, and branding.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
