import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { addSubscriber, listSubscribers } from "@/lib/store";
import { newsletterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);
    const limited = rateLimit({
      key: `newsletter:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 },
      );
    }

    const json = await req.json();
    const parsed = newsletterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const subscriber = await addSubscriber(parsed.data.email);
    return NextResponse.json({ ok: true, subscriber: { email: subscriber.email } });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscribers = await listSubscribers();
  return NextResponse.json({ subscribers });
}
