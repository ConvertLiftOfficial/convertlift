import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get("audit_id");

    if (!auditId) {
      return NextResponse.json({ unlocked: false, error: "Missing audit_id" }, { status: 400 });
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ unlocked: false, error: "Redis config missing" }, { status: 500 });
    }

    // Check Redis for audit:{audit_id}
    const response = await fetch(`${redisUrl}/get/audit:${auditId}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    const data = await response.json();
    
    // Upstash returns the value in `data.result` (it will be "true" if paid)
    const isUnlocked = data.result === "true" || data.result === true;

    return NextResponse.json({ unlocked: isUnlocked });
  } catch (err) {
    console.error("Verify audit error:", err);
    return NextResponse.json({ unlocked: false, error: "Verification failed" }, { status: 500 });
  }
}