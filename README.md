# ConvertLift

Instant AI-powered conversion diagnostics for landing pages, sales copy, and cold emails. Paste copy in, get 2 critiques free, unlock the full 10-point report for $2.99.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + Framer Motion + Lucide React
- Anthropic Claude API (`claude-3-5-sonnet-20241022`) for the audit engine
- Lemon Squeezy for checkout (Merchant of Record — handles tax, Apple Pay/Google Pay)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in:
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `LEMONSQUEEZY_API_KEY` — Lemon Squeezy Settings → API
   - `LEMONSQUEEZY_STORE_ID` — your store's numeric ID
   - `LEMONSQUEEZY_VARIANT_ID` — the variant ID of your $2.99 one-time product
   - `NEXT_PUBLIC_SITE_URL` — your deployed URL (or `http://localhost:3000` locally)

3. Run the dev server:
   ```
   npm run dev
   ```

## How unlocking works

1. A visitor runs an audit; the full 10-point result is generated server-side in one call and stored client-side in `sessionStorage` under a generated `auditId`, keyed so it survives the round trip to checkout.
2. Only points 1–2 render unblurred. Points 3–10 sit behind a blurred paywall.
3. "Unlock Full Audit" calls `/api/checkout`, which creates a Lemon Squeezy hosted checkout session with a `redirect_url` back to `/success?audit_id=...`.
4. `/success` confirms the `auditId` is present, marks it unlocked in `sessionStorage`, and redirects to `/?audit_id=...&unlocked=true`, which lifts the blur.

This keeps the MVP fully serverless with no database. For production, also verify purchases with a Lemon Squeezy webhook (`order_created`) against your own store, since `sessionStorage` alone can be cleared or spoofed by a determined user — the webhook is your source of truth for fulfillment/analytics even though the client-side unlock is what drives the UI here.

## Deploy

Works out of the box on Vercel. Set the same environment variables in your project settings.
