# AI QR System

A QR-code review funnel for local businesses: customers scan a code, rate their visit, get an AI-drafted review to post on Google (or send private feedback instead), and every scan is tracked in a built-in customer CRM and analytics dashboard.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set SESSION_SECRET to a random value:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run dev
```

Data is stored locally in a SQLite file at `data/app.db` (created automatically, gitignored).

On first run, an admin account is created with the password **`admin123`** — a warning is printed to the console as a reminder. Log in at `/login` and change it immediately from the Settings page.

## Pages

- `/` — QR code, download/share, business settings, feedback-routing mode, admin password
- `/qr` — the public customer-facing flow (star rating → AI review draft or private feedback)
- `/analytics` — scan counts, conversion rate, rating distribution, 14-day trend
- `/feedback` — private feedback inbox for low ratings
- `/customers` — customer CRM: search, add/edit/delete, review counts

## Feedback routing modes

- **Gated** — 4-5★ visitors are guided to your public review link; 1-3★ visitors are routed to a private feedback inbox only.
- **Always Open** — every visitor can choose between leaving a public review or sending private feedback, regardless of rating.

The FTC's 2024 rule on review gating targets exactly the "Gated" pattern in the US; "Always Open" is the compliant default if that applies to you. Both are available from Settings.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · SQLite via Node's built-in `node:sqlite` (no native build step) · `qrcode.react` for QR rendering.

## Deploying

This app needs a writable filesystem for its SQLite database, so it won't run as-is on purely serverless/edge platforms (e.g. Vercel's default runtime) — deploy it somewhere with persistent disk (a VM, a container with an attached volume, `next start` on your own server, etc.), and always set `SESSION_SECRET` in the environment.
