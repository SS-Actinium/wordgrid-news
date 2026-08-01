import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { ArticleForm } from "../ArticleForm";

export default async function NewArticlePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-news-ink dark:text-white">
          New article
        </h1>
        <p className="mt-1 text-sm text-news-muted">
          Write manually or use <strong>Auto-fill with AI</strong>, then run the
          SEO engine. Published posts appear on the public site with all other
          news.
        </p>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
