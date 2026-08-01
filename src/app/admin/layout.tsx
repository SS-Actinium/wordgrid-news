import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin · World Grid",
  robots: { index: false, follow: false },
};

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/articles/new", label: "New" },
  { href: "/admin/ai", label: "AI News" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/keys", label: "AI Keys" },
  { href: "/admin/settings", label: "Settings" },
];

function isAdminLoginPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname");
  const onLogin = isAdminLoginPath(pathname);

  // Defense in depth: full HMAC session verify (middleware only checks cookie presence).
  // Only redirect when pathname is known and is not login — avoids loops if x-pathname is absent.
  if (pathname && !onLogin && !(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-news-soft dark:bg-[#0a0a0a]">
      <div className="border-b border-news-line bg-news-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href={onLogin ? "/admin/login" : "/admin"} className="font-bold">
              World<span className="text-news-red">Grid</span> Admin
            </Link>
            {!onLogin && (
              <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/70">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← View site
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
