import type { Metadata } from "next";
import Link from "next/link";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-news-soft dark:bg-[#0a0a0a]">
      <div className="border-b border-news-line bg-news-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/admin" className="font-bold">
              World<span className="text-news-red">Grid</span> Admin
            </Link>
            <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/70">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              ))}
            </nav>
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
