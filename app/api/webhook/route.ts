import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

    // 1. Verify signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = hmac.update(rawBody).digest("hex");

    if (signature !== digest) {
      console.error("Webhook signature mismatch!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    
    // Lemon Squeezy stores custom data inside event.data.attributes.custom_data or meta.custom_data
    const customData = event.data?.attributes?.custom_data || event.meta?.custom_data;
    const auditId = customData?.audit_id;

    console.log("Webhook received event:", event.meta?.event_name, "for audit_id:", auditId);

    if (auditId) {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        // Save to Upstash Redis
        const response = await fetch(`${redisUrl}/set/audit:${auditId}/true`, {
          headers: {
            Authorization: `Bearer ${redisToken}`,
          },
        });
        const data = await response.json();
        console.log("Upstash save response:", data);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}