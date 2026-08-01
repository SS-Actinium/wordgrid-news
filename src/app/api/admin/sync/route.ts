import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncWorldNews } from "@/lib/news-sync";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncWorldNews();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
