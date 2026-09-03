# AI QR System

A multi-tenant QR-code review funnel for local businesses: customers scan a code, rate their visit, get an AI-drafted review to post on Google (or send private feedback instead), and every scan is tracked in a per-business CRM and analytics dashboard.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set SESSION_SECRET to a random value:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run dev
```

Data is stored locally in a SQLite file at `data/app.db` (created automatically, gitignored).

Visit `/signup` to create a business account — this generates a unique QR slug (e.g. `/qr/joes-cafe-x7k2`), a review-funnel dashboard, and an owner login for that business. There is no shared/default admin account anymore; every business's data (customers, feedback, analytics, settings) is isolated by `business_id`.

## Multi-tenancy model

- **Businesses** each have their own slug, review link, feedback mode, customers, feedback inbox, and analytics — fully isolated from every other business in the same deployment.
- **Users** belong to exactly one business and have a role: `owner` (can manage settings, customers, feedback, analytics, and team members) or `staff` (same access minus team management). The owner adds staff logins from `/team`.
- The public `/qr/[slug]` page and its supporting `/api/public/[slug]/*` endpoints don't require a login — they're what customers hit when they scan the code — but they only ever read/write data scoped to that one business.

## Pages

- `/signup`, `/login` — create or access a business account
- `/` — QR code, download/share, business settings, feedback-routing mode, your password
- `/qr/[slug]` — the public customer-facing flow (star rating → AI review draft or private feedback)
- `/analytics` — scan counts, conversion rate, rating distribution, 14-day trend
- `/feedback` — private feedback inbox for low ratings
- `/customers` — customer CRM: search, add/edit/delete, review counts
- `/team` — owner-only: add or remove staff logins

## Feedback routing modes

- **Gated** — 4-5★ visitors are guided to your public review link; 1-3★ visitors are routed to a private feedback inbox only.
- **Always Open** — every visitor can choose between leaving a public review or sending private feedback, regardless of rating.

The FTC's 2024 rule on review gating targets exactly the "Gated" pattern in the US; "Always Open" is the compliant default if that applies to you. Both are available per-business from Settings.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · SQLite via Node's built-in `node:sqlite` (no native build step) · `qrcode.react` for QR rendering. Sessions are signed cookies (Web Crypto HMAC) carrying `{ userId, businessId, role }`, verified in `proxy.ts` and forwarded to API routes via headers — no server-side session store needed.

## Deploying

This app needs a writable filesystem for its SQLite database, so it won't run as-is on purely serverless/edge platforms (e.g. Vercel's default runtime) — deploy it somewhere with persistent disk (a VM, a container with an attached volume, `next start` on your own server, etc.), and always set `SESSION_SECRET` in the environment.
