# ⚡ ReviveAI — Smart Failed-Payment Recovery Assistant

**Track 03: AI Revenue Recovery — Razorpay Buildathon**

> Indian subscription businesses lose 8–15% of recurring revenue every month to failed payments — not from churn, from mishandled failures. For a business doing ₹10L/month, that's up to **₹1.5L vanishing every month**, for no real reason. ReviveAI gets it back.

<img width="1895" height="852" alt="image" src="https://github.com/user-attachments/assets/59de4463-4295-4526-92cc-5134af0d033c" />

🔗 **Live Demo:** [razorpay-buildathon-inky.vercel.app](https://razorpay-buildathon-inky.vercel.app)
🎥 **5-min Pitch Video:** [https://drive.google.com/file/d/1kZqvAb0S92ljmPlXqjUE30lLAZhcQtta/view?usp=sharing]

---

## The Problem

Most businesses handle failed recurring payments badly: they either retry blindly — wasting attempts on unfixable issues like an expired card — or don't retry at all, silently losing revenue that was never actually lost, just mismanaged. Nobody's asking *why* a payment failed before deciding what to do about it.

## The Solution

ReviveAI reads the *reason* behind every failed payment and responds intelligently instead of generically:

| Failure Type | What ReviveAI Does |
|---|---|
| Insufficient Funds | Silently auto-retries near typical salary cycles — no customer disruption |
| Card Expired | Retrying is pointless — sends an update request immediately |
| Method Restricted | Requests a different payment method right away |
| Network/Gateway Glitch | Quick silent retry within hours — usually resolves itself |
| No resolution after 2 silent attempts | Automatically escalates to a real recovery payment link |

Every recovery is tracked back to actual confirmed payment — so ReviveAI reports **revenue genuinely recovered**, not just links sent into the void.

## How It Works — End to End

1. **Detect** — A real Razorpay webhook (`payment.failed`) is received and cryptographically verified via HMAC SHA-256 signature checking — no unverified request is ever trusted
2. **Classify** — `error_code`, `error_reason`, and `error_source` run through a rules-based classification engine, sorting every failure into one of 7 categories
3. **Act** — The system executes the matched retry strategy automatically, via an hourly scheduled cron job — silent retry, immediate link, or escalation, with zero manual clicking required
4. **Confirm** — A second webhook (`payment_link.paid`) fires when the customer actually pays, flipping the record to **Recovered** and updating live revenue stats

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Payments:** Razorpay — Orders API, Payment Links API, Webhooks
- **Hosting:** Vercel, with automated cron scheduling

## Key Features

- ✅ Real-time webhook ingestion with signature verification
- ✅ 7-category rules-based failure classification engine
- ✅ Fully automated retry-then-escalate logic — no manual intervention
- ✅ Live dashboard — total failures, amount at risk, revenue recovered, recovery rate
- ✅ Scenario Simulator — Razorpay's sandbox only ever returns one generic failure reason, so this injects production-accurate error data across all 6 real-world failure types, proving the classifier works correctly end to end

## Project Structure

```
app/
  api/
    webhooks/razorpay/          # Core webhook handler (payment.failed, payment_link.paid)
    create-test-order/          # Creates real Razorpay sandbox orders
    generate-recovery-link/     # Generates Payment Links for pending failures
    generate-manual-link/       # Merchant-initiated manual recovery links
    simulate-failure/           # Scenario simulator for demo data
    cron/process-retries/       # Automated retry & escalation engine
  dashboard/                    # Live merchant dashboard
  test-payment/                 # Real checkout + Scenario Simulator UI
lib/
  classify-failure.ts           # Failure classification logic
  supabase.ts / supabase-admin.ts
```

## Setup

1. Clone and install:
```bash
   git clone https://github.com/shruu1403/razorpay_buildathon
   cd razorpay_buildathon
   npm install
```
2. Add environment variables to `.env.local`:
```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   RAZORPAY_WEBHOOK_SECRET=
   CRON_SECRET=
```
3. Run locally:
```bash
   npm run dev
```
4. Register your webhook URL in Razorpay Dashboard → Settings → Webhooks, enabling `payment.failed` and `payment_link.paid` events.

## Built Under Real Constraints

- Razorpay's sandbox always returns a generic `payment_failed` reason regardless of the actual failure — the Scenario Simulator exists specifically to demonstrate real-world classification despite this
- Hit a schema mismatch mid-build where insert code referenced a column that didn't exist yet in Supabase — fixed via migration, and a reminder to keep schema and code in lockstep during rapid iteration
- Windows Defender flagged a freshly-updated `ngrok` binary as a trojan (a known false positive) — required a folder exclusion and reinstall before local webhook testing could even begin

## Known Limitations

- No custom notification layer — relies on Razorpay's built-in SMS/email for payment link delivery
- Cron job requires an external scheduler trigger (configured via `vercel.json` for hourly runs on Vercel)
- No audit trail/history log — only current state is stored per payment
- No dashboard authentication (open access for demo purposes)
- No webhook deduplication — a duplicate Razorpay webhook could theoretically insert a duplicate row

---

Built in one week for the Razorpay Buildathon — Track 03: AI Revenue Recovery.
