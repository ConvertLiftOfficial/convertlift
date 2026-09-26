import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

interface LemonCheckoutResponse {
  data: {
    attributes: {
      url: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    if (!apiKey || !storeId || !variantId) {
      return NextResponse.json(
        {
          error:
            "Checkout is not configured. Set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and LEMONSQUEEZY_VARIANT_ID.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const auditId: string = typeof body?.auditId === "string" ? body.auditId : crypto.randomUUID();

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: true,
            media: false,
            logo: true,
            dark: true,
          },
          checkout_data: {
            custom: {
              audit_id: auditId,
            },
          },
          product_options: {
            redirect_url: `${siteUrl}/success?audit_id=${encodeURIComponent(auditId)}`,
            receipt_button_text: "Back to your audit",
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: variantId },
          },
        },
      },
    };

    const response = await fetch(`${LEMON_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lemon Squeezy checkout error:", errText);
      return NextResponse.json(
        { error: "Could not create checkout session. Please try again in a moment." },
        { status: 502 }
      );
    }

    const json = (await response.json()) as LemonCheckoutResponse;
    const checkoutUrl = json.data.attributes.url;

    return NextResponse.json({ url: checkoutUrl, auditId });
  } catch (err) {
    console.error("Checkout route error:", err);
    return NextResponse.json(
      { error: "Something went wrong starting checkout. Please try again." },
      { status: 500 }
    );
  }
}
