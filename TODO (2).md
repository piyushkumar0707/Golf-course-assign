# Golf Charity Subscription Platform — Implementation Plan

> **Stack**: Next.js 14 (App Router) · Supabase (Auth + PostgreSQL + Storage) · Stripe · Vercel
>
> **Why this stack:**
> - Next.js App Router gives you API routes, server-side middleware, and server actions in one project — no separate backend server needed
> - Supabase free tier includes PostgreSQL (500MB), Auth, Storage (1GB), and Edge Functions — everything this platform needs at zero cost
> - Single Vercel deployment covers both frontend and all API routes
> - Alternative DB: **Neon** (serverless Postgres, generous free tier) is a drop-in swap if you prefer — but you'd lose Supabase Auth and Storage and need separate replacements

---

## Folder Structure (reference)

```
/
├── app/
│   ├── (auth)/              # login, signup, forgot-password, reset-password
│   ├── (public)/            # home, about, charities, draws, how-it-works
│   ├── dashboard/           # protected user area
│   ├── admin/               # protected admin area
│   ├── subscribe/           # subscription + charity selection flow
│   └── api/                 # all API route handlers
│       ├── stripe/
│       ├── scores/
│       ├── draws/
│       ├── charities/
│       ├── winners/
│       ├── admin/
│       └── cron/
├── components/              # shared UI components
├── lib/
│   ├── supabase/            # server + browser client helpers
│   ├── stripe.ts
│   ├── draw-engine.ts       # pure draw logic
│   ├── prize-pool.ts        # pure prize calculation
│   └── mailer.ts            # Resend email wrapper
├── middleware.ts             # global auth + subscription gating
└── types/                   # shared TypeScript interfaces
```

---

## Phase 1 — Project Setup & Infrastructure

### 1.1 Repository & Environment
- [ ] Initialise Next.js project: `npx create-next-app@latest --typescript --tailwind --app`
- [ ] Configure ESLint + Prettier
- [ ] Create `.env.local` with all environment variable keys as empty placeholders
- [ ] Set up Git repository with a clean initial commit
- [ ] Create a new Vercel account (not personal/existing) and connect the repository
- [ ] Create a new Supabase project (not personal/existing) — note the project URL and keys

### 1.2 Supabase Configuration
- [ ] Enable Supabase Auth — email/password provider
- [ ] Create a Supabase Storage bucket `winner-proofs` — set to private (auth required)
- [ ] Install: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create `lib/supabase/server.ts` — server-side client using `createServerClient` from `@supabase/ssr`
- [ ] Create `lib/supabase/browser.ts` — browser singleton using `createBrowserClient`
- [ ] Add to `.env.local` and Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never exposed to browser)

### 1.3 Stripe Configuration
- [ ] Create Stripe account and retrieve API keys
- [ ] Create two Stripe Products with recurring prices: `Monthly Plan` and `Yearly Plan`
- [ ] Note both Price IDs — add to `.env.local` as `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`
- [ ] Add to `.env.local` and Vercel dashboard:
  - `STRIPE_SECRET_KEY` (server-side only)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] Install: `npm install stripe @stripe/stripe-js`
- [ ] Create `lib/stripe.ts` — exports a single configured Stripe SDK instance

### 1.4 Database Schema
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Run `supabase init` and `supabase link --project-ref <your-ref>`
- [ ] Write migration files in `/supabase/migrations/` for the following tables:

  **`profiles`** — extends Supabase auth.users
  ```sql
  id uuid references auth.users primary key,
  full_name text,
  role text default 'subscriber',        -- 'subscriber' | 'admin'
  subscription_status text default 'inactive',
  created_at timestamptz default now()
  ```

  **`subscriptions`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text,                             -- 'monthly' | 'yearly'
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
  ```

  **`scores`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  score integer check (score between 1 and 45),
  played_on date,
  created_at timestamptz default now()
  ```

  **`charities`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_urls text[],
  events jsonb,                          -- [{title, date, description}]
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
  ```

  **`user_charity`**
  ```sql
  user_id uuid references profiles(id) primary key,
  charity_id uuid references charities(id),
  contribution_pct integer default 10
    check (contribution_pct >= 10 and contribution_pct <= 100),
  updated_at timestamptz default now()
  ```

  **`draws`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  month integer,
  year integer,
  draw_type text,                        -- 'random' | 'weighted'
  status text default 'pending',         -- 'pending' | 'simulated' | 'published'
  winning_numbers integer[],
  jackpot_carried_in numeric default 0,
  jackpot_carry_out numeric default 0,
  created_at timestamptz default now()
  ```

  **`draw_entries`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id),
  user_id uuid references profiles(id),
  scores_snapshot integer[],
  tier_matched integer,                  -- 3, 4, 5, or null
  created_at timestamptz default now()
  ```

  **`prize_pool`**
  ```sql
  draw_id uuid references draws(id) primary key,
  total_pool numeric,
  pool_tier_5 numeric,
  pool_tier_4 numeric,
  pool_tier_3 numeric,
  winners_tier_5 integer default 0,
  winners_tier_4 integer default 0,
  winners_tier_3 integer default 0
  ```

  **`winners`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id),
  user_id uuid references profiles(id),
  tier integer,
  prize_amount numeric,
  proof_url text,
  proof_status text default 'awaiting',  -- 'awaiting' | 'pending' | 'approved' | 'rejected'
  payment_status text default 'unpaid',  -- 'unpaid' | 'paid'
  rejection_reason text,
  created_at timestamptz default now()
  ```

  **`audit_log`**
  ```sql
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
  ```

- [ ] Apply migrations: `supabase db push`

### 1.5 Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] `profiles` — users read/update their own row; admins read all
- [ ] `subscriptions` — users read their own; only service role writes (Stripe webhook)
- [ ] `scores` — users CRUD their own; admins update any
- [ ] `charities` — all authenticated users read; admins write
- [ ] `user_charity` — users read/update their own row
- [ ] `draws` — all authenticated users read published draws; admins write
- [ ] `draw_entries` — users read their own; admins read all
- [ ] `winners` — users read their own; admins read/update all
- [ ] `prize_pool` — all authenticated users read; service role writes
- [ ] `audit_log` — admins read; service role writes

### 1.6 Database Triggers
- [ ] **Score rolling trigger**: on INSERT to `scores`, if user now has > 5 rows, delete the oldest by `created_at`
- [ ] **Profile creation trigger**: on INSERT to `auth.users`, auto-create matching row in `profiles`
- [ ] Test both triggers in Supabase SQL editor before proceeding

---

## Phase 2 — Authentication & Middleware

### 2.1 Auth Pages
- [ ] Create `app/(auth)/signup/page.tsx` — full name, email, password; calls `supabase.auth.signUp`
- [ ] Create `app/(auth)/login/page.tsx` — email, password; calls `supabase.auth.signInWithPassword`
- [ ] Create `app/(auth)/forgot-password/page.tsx` — calls `supabase.auth.resetPasswordForEmail`
- [ ] Create `app/(auth)/reset-password/page.tsx` — new password form; handles magic link callback
- [ ] Create `app/(auth)/layout.tsx` — minimal layout (logo only) for all auth pages
- [ ] Handle errors inline — no browser alerts, friendly messages only

### 2.2 Middleware (Global Route Guard)
- [ ] Create `middleware.ts` at project root — runs on every matched request via Next.js edge runtime
- [ ] Refresh Supabase session cookie on every request (required by `@supabase/ssr`)
- [ ] No session + route under `/dashboard/*` or `/admin/*` → redirect to `/login`
- [ ] Role not `admin` + route under `/admin/*` → redirect to `/dashboard`
- [ ] Subscription not `active` + route under `/dashboard/*` → redirect to `/subscribe`
  - Exception: allow `/dashboard/settings` even when lapsed (so user can manage subscription)
- [ ] Public routes (`/`, `/charities`, `/draws`, `/about`, `/how-it-works`) always pass through

### 2.3 Session Utilities
- [ ] Create `lib/auth.ts` — server-side helper `getUser()` that returns user + role from session
- [ ] Create `useUser()` client hook — subscribes to `supabase.auth.onAuthStateChange`
- [ ] Seed admin user: create in Supabase Auth dashboard, set `role = 'admin'` in `profiles` table

---

## Phase 3 — Subscription & Payment System

### 3.1 Subscribe Page
- [ ] Create `app/subscribe/page.tsx` — two plan cards: monthly vs yearly with pricing
- [ ] Show included benefits on each card: draw entry, charity contribution, prize eligibility
- [ ] On plan selection: POST to `/api/stripe/create-checkout` → redirect browser to returned Stripe URL
- [ ] Create `app/subscribe/success/page.tsx` — confirm activation, prompt charity selection, link to dashboard
- [ ] Create `app/subscribe/cancel/page.tsx` — soft message, retry CTA

### 3.2 Stripe API Routes
- [ ] Create `app/api/stripe/create-checkout/route.ts`
  - Verify session (must be logged in)
  - Create or retrieve Stripe customer linked to `user_id`
  - Create Checkout Session with selected Price ID, success/cancel URLs
  - Return `{ url }` — frontend redirects to it
- [ ] Create `app/api/stripe/create-portal/route.ts`
  - Verify session
  - Fetch `stripe_customer_id` from `subscriptions`
  - Create Billing Portal session
  - Return `{ url }` — frontend redirects to it

### 3.3 Stripe Webhook
- [ ] Create `app/api/stripe/webhook/route.ts`
  - Read raw body with `request.text()` — required for Stripe signature verification
  - Verify: `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
  - `checkout.session.completed` → upsert `subscriptions`, set `profiles.subscription_status = 'active'`
  - `customer.subscription.updated` → update status + `current_period_end`
  - `customer.subscription.deleted` → set status `cancelled` + `subscription_status = 'inactive'`
  - `invoice.payment_failed` → set status `lapsed`, trigger lapsed email
  - All DB writes use **service role** Supabase client
- [ ] Register webhook in Stripe dashboard
- [ ] Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Test all four webhook events with Stripe CLI trigger commands

### 3.4 Subscription UI (Dashboard)
- [ ] Dashboard subscription card: plan name, status badge, renewal date, "Manage" button
- [ ] "Manage" → POST to `/api/stripe/create-portal` → redirect
- [ ] Lapsed banner across entire dashboard — prominent re-subscribe CTA
- [ ] Auto-calculate charity minimum: `plan_price_pence × 0.10` displayed during charity selection

---

## Phase 4 — Score Management System

### 4.1 Score Entry Component
- [ ] Create `components/ScoreEntry.tsx`
  - Single score + date fields per entry
  - Client-side validation: integer 1–45, date not in future, `played_on` within last 12 months
  - POST to `/api/scores` on submit — optimistic UI update
  - Progress indicator: "3 of 5 scores entered"
  - Empty state prompt when no scores exist

### 4.2 Score API Routes
- [ ] Create `app/api/scores/route.ts`
  - `GET` — verify session, return user's scores ordered by `played_on DESC`
  - `POST` — verify session, validate inputs, insert row; DB trigger handles rolling deletion
- [ ] Create `app/api/scores/[id]/route.ts`
  - `PATCH` — verify session + ownership, validate new values, update row
  - `DELETE` — verify session + ownership, delete row

### 4.3 Score Display
- [ ] List scores in reverse chronological order: score value, date, relative time label
- [ ] Inline edit per row — pencil icon opens edit mode in place
- [ ] Success toast on save; revert to previous value on error

### 4.4 Admin Score Override
- [ ] Admin view of any user's scores at `app/admin/users/[id]/page.tsx`
- [ ] Create `app/api/admin/scores/[id]/route.ts` — `PATCH` using service role, no ownership check
- [ ] Every admin edit writes to `audit_log` (admin_id, target user id, old value, new value)

---

## Phase 5 — Draw & Reward System

### 5.1 Draw Engine (Pure Logic)
- [ ] Create `lib/draw-engine.ts`
  - `randomDraw(): number[]` — 5 unique random integers between 1–45
  - `weightedDraw(allScores: number[]): number[]` — tallies frequency across all users, weighted random selection, returns 5 numbers
  - `matchTier(userScores: number[], drawn: number[]): 3 | 4 | 5 | null` — returns highest match count if ≥ 3
- [ ] Unit test all three functions — edge cases: ties in weighted, no matches, exact 5-match

### 5.2 Prize Pool Calculator (Pure Logic)
- [ ] Create `lib/prize-pool.ts`
  - `calculatePool(subscriberCount, pricePerUser, jackpotCarryIn)` → `{ tier5, tier4, tier3 }` using 40/35/25 split
  - `splitPrize(tierPool, winnerCount): number` — equal division, stored in pence to avoid float errors
  - `shouldCarryJackpot(tier5Winners: number): boolean`
- [ ] Unit test: zero winners, multiple winners per tier, jackpot carry scenarios

### 5.3 Draw API Routes (Admin Only)
- [ ] Create `app/api/admin/draws/simulate/route.ts`
  - `POST` — verify admin role
  - Run draw logic, compute tier matches for all eligible users
  - Return full preview without writing to DB
- [ ] Create `app/api/admin/draws/publish/route.ts`
  - `POST` — verify admin role
  - Run draw, save `draws` row (`status = 'published'`)
  - Snapshot eligible users' scores into `draw_entries`
  - Calculate and save `prize_pool`
  - Create `winners` rows for all tier matches
  - If no 5-match winner, set `jackpot_carry_out` for next draw
  - Trigger winner notification emails
  - Eligibility: `subscription_status = 'active'` AND exactly 5 scores recorded

### 5.4 Draw Results UI
- [ ] Create `app/(public)/draws/page.tsx` — list of all published draws (no login needed)
- [ ] Create `app/(public)/draws/[id]/page.tsx` — individual draw results
  - Winning numbers revealed with staggered CSS animation
  - Tier breakdown table: match type, winner count, prize per winner
  - Jackpot carry notice if no 5-match winner
- [ ] Dashboard draw card: draws entered, last result, countdown to next draw

---

## Phase 6 — Charity System

### 6.1 Charity Directory (Public)
- [ ] Create `app/(public)/charities/page.tsx` — charity grid, accessible without login
  - Client-side search by name
  - Featured charities pinned to top
- [ ] Create `app/(public)/charities/[id]/page.tsx` — charity profile
  - Name, description, image gallery, upcoming events list

### 6.2 Charity API Routes
- [ ] Create `app/api/charities/route.ts` — `GET` returns all active charities; supports `?featured=true`
- [ ] Create `app/api/charities/[id]/route.ts` — `GET` returns single charity
- [ ] Create `app/api/user/charity/route.ts`
  - `GET` — return current user's charity selection
  - `POST` / `PATCH` — save charity + contribution percentage to `user_charity`

### 6.3 Charity Selection Flow
- [ ] Step shown after successful subscription on `/subscribe/success`
- [ ] Charity cards with radio-style selection
- [ ] Contribution percentage slider: 10–100%, default 10%
- [ ] Live preview: "You'll donate £X per month to [Charity]"
- [ ] Confirm button POSTs to `/api/user/charity`
- [ ] Independent donation: Stripe Payment Link embedded on charity profile page

### 6.4 Charity Management (Admin)
- [ ] Create `app/admin/charities/page.tsx` — list with edit/toggle-featured/delete actions
- [ ] Create `app/admin/charities/new/page.tsx` — creation form
- [ ] Create `app/admin/charities/[id]/edit/page.tsx` — edit form
- [ ] Image upload: client uploads to Supabase Storage; returns URL saved to `charities.image_urls`
- [ ] Featured toggle: API enforces only one featured at a time (unset others on update)
- [ ] Soft delete only: `is_active = false`, never hard delete
- [ ] Create `app/api/admin/charities/route.ts` — `POST` (admin only)
- [ ] Create `app/api/admin/charities/[id]/route.ts` — `PATCH`, `DELETE` (admin only)

---

## Phase 7 — Winner Verification System

### 7.1 Winner Notification Email
- [ ] On draw publish, iterate all new `winners` rows and send individual notification emails
- [ ] Email contains: tier matched, prize amount, link to dashboard proof upload

### 7.2 Proof Submission
- [ ] Dashboard proof section visible only when user has a `winners` row with `proof_status = 'awaiting'`
- [ ] File upload component — direct upload to Supabase Storage `winner-proofs/` bucket
  - Accepted: PNG, JPG, PDF — validate MIME type client-side and server-side
  - Max file size: 5MB
- [ ] Create `app/api/winners/[id]/proof/route.ts`
  - `POST` — verify session + ownership of the winner row
  - Save `proof_url`, set `proof_status = 'pending'`
- [ ] Show status badge: Awaiting → Pending → Approved / Rejected → Paid
- [ ] Disable re-upload while status is `pending`; re-enable if `rejected`

### 7.3 Admin Verification
- [ ] Create `app/admin/winners/page.tsx` — filterable by draw and payment status
- [ ] Inline proof preview: image or PDF iframe loaded from Supabase Storage signed URL
- [ ] Approve button → `PATCH /api/admin/winners/[id]` → `proof_status = 'approved'`; sends approval email
- [ ] Reject button → modal for rejection reason → `proof_status = 'awaiting'` (allows resubmit); sends rejection email
- [ ] Mark as paid → `payment_status = 'paid'`; sends payment confirmation email
- [ ] Create `app/api/admin/winners/[id]/route.ts` — `PATCH` (admin only)

---

## Phase 8 — User Dashboard

### 8.1 Layout
- [ ] Create `app/dashboard/layout.tsx` — sidebar on desktop, bottom nav on mobile
- [ ] Nav links: Overview, Scores, My Charity, Draws, Winnings, Settings
- [ ] Subscription status badge in sidebar (green = active, amber = lapsed)

### 8.2 Overview (`app/dashboard/page.tsx`)
- [ ] Subscription card: plan, status, renewal date, Manage button
- [ ] Score summary card: mini list + "Add score" shortcut
- [ ] Charity card: logo, name, monthly contribution amount
- [ ] Next draw countdown timer
- [ ] Recent win highlight with payment status (if applicable)

### 8.3 Scores Page (`app/dashboard/scores/page.tsx`)
- [ ] Full score entry and edit interface using `ScoreEntry` component

### 8.4 Charity Page (`app/dashboard/charity/page.tsx`)
- [ ] Current charity with image + description
- [ ] Editable contribution percentage slider
- [ ] "Change charity" link — reopens selector

### 8.5 Draws Page (`app/dashboard/draws/page.tsx`)
- [ ] All draws entered: date, result (win/no match), tier, prize amount

### 8.6 Winnings Page (`app/dashboard/winnings/page.tsx`)
- [ ] Total won (all time)
- [ ] Per-win breakdown: draw date, tier, amount, proof status, payment status
- [ ] Proof upload section when `proof_status = 'awaiting'`

### 8.7 Settings Page (`app/dashboard/settings/page.tsx`)
- [ ] Update name and email
- [ ] Change password
- [ ] Subscription management link (opens Stripe portal)
- [ ] Accessible even when subscription is lapsed (middleware exception)

---

## Phase 9 — Admin Dashboard

### 9.1 Layout
- [ ] Create `app/admin/layout.tsx` — server component; reads session and redirects non-admins immediately
- [ ] Sidebar: Users, Draws, Charities, Winners, Reports
- [ ] Show admin's name and "Back to site" link in sidebar footer

### 9.2 User Management
- [ ] Create `app/admin/users/page.tsx` — paginated table (25/page) with search by name/email
- [ ] Create `app/admin/users/[id]/page.tsx` — profile, subscription, scores, charity, draw/win history
- [ ] Inline subscription status override — write via `PATCH /api/admin/users/[id]`
- [ ] Inline score edit with audit log (Phase 4.4)

### 9.3 Draw Management
- [ ] Create `app/admin/draws/page.tsx` — all draws sorted newest first, with status badges
- [ ] Create draw form: pick month/year + draw type → `POST /api/admin/draws`
- [ ] Simulate button: calls simulate endpoint, shows results preview inline on same page
- [ ] Publish button: confirmation modal ("This cannot be undone") → calls publish endpoint
- [ ] Create `app/admin/draws/[id]/page.tsx` — winning numbers, tier breakdown, full winner list

### 9.4 Charity Management
- [ ] Already covered in Phase 6.4

### 9.5 Winners Management
- [ ] Already covered in Phase 7.3

### 9.6 Reports & Analytics
- [ ] Create `app/admin/reports/page.tsx`
  - Live stats: total active subscribers, current month prize pool, total donated to charities
  - Draw history: match rates per tier, jackpot history
- [ ] Create `app/api/admin/reports/export/route.ts`
  - `GET ?type=users|winners|draws` — returns CSV with `Content-Disposition: attachment` header
  - Frontend triggers download via `<a href="/api/admin/reports/export?type=users" download>`

---

## Phase 10 — Homepage & Public Pages

### 10.1 Homepage (`app/(public)/page.tsx`)
- [ ] **Hero** — lead with charity impact (total donated, charities supported), not golf imagery
  - Live stats from DB: total subscribers, total donated to charity
  - Primary CTA: "Subscribe & Start Playing"
- [ ] **How it works** — 3-step visual: Subscribe → Enter Scores → Win & Give
- [ ] **Featured charity spotlight** — fetched via `GET /api/charities?featured=true`
- [ ] **Draw mechanics** — visual explainer of 3/4/5 match tiers and jackpot
- [ ] **Pricing** — monthly vs yearly cards with charity contribution shown per plan
- [ ] **Bottom CTA** — repeated subscribe button
- [ ] Framer Motion scroll-triggered animations and micro-interactions
- [ ] No golf clichés — no fairway imagery, plaid, or club motifs as primary design language

### 10.2 Other Public Pages
- [ ] `app/(public)/about/page.tsx` — platform mission, charity-first philosophy
- [ ] `app/(public)/how-it-works/page.tsx` — draw mechanics, score entry, prize tiers explained
- [ ] `/charities` and `/draws` reuse pages already built in Phases 5 and 6

---

## Phase 11 — Notifications & Emails

### 11.1 Setup
- [ ] Sign up for Resend (free tier: 3,000 emails/month — sufficient for MVP)
- [ ] Add `RESEND_API_KEY` to `.env.local` and Vercel dashboard
- [ ] Install: `npm install resend`
- [ ] Create `lib/mailer.ts` — one exported async function per email type, all typed

### 11.2 Email Triggers
- [ ] **Welcome** — triggered in `POST /api/auth/callback` or directly after `signUp`; includes charity selection link
- [ ] **Subscription confirmed** — triggered from `checkout.session.completed` webhook handler
- [ ] **Draw reminder** — triggered by Vercel Cron Job 2 days before end of month
- [ ] **Draw results** — triggered on draw publish; personalised per user (their scores vs winning numbers, did they win)
- [ ] **Winner notification** — triggered on draw publish; tier, prize amount, proof upload link
- [ ] **Proof received** — triggered when user submits proof; "we'll review within 48 hours"
- [ ] **Proof approved** — triggered when admin approves
- [ ] **Proof rejected** — triggered when admin rejects; includes reason + re-upload link
- [ ] **Payment sent** — triggered when admin marks winner as paid
- [ ] **Renewal reminder** — triggered by Vercel Cron Job 3 days before `current_period_end`
- [ ] **Subscription lapsed** — triggered from `invoice.payment_failed` webhook; re-subscribe link

### 11.3 Vercel Cron Jobs (free on Hobby plan)
- [ ] Create `app/api/cron/draw-reminder/route.ts` — finds upcoming draws for current month, emails all active subscribers
- [ ] Create `app/api/cron/renewal-reminder/route.ts` — finds subscriptions expiring in 3 days, sends reminder email
- [ ] Configure both in `vercel.json`:
  ```json
  {
    "crons": [
      { "path": "/api/cron/draw-reminder", "schedule": "0 9 28 * *" },
      { "path": "/api/cron/renewal-reminder", "schedule": "0 9 * * *" }
    ]
  }
  ```
- [ ] Protect cron routes: check `Authorization: Bearer ${CRON_SECRET}` header on every request

---

## Phase 12 — QA, Testing & Deployment

### 12.1 Unit Tests
- [ ] `lib/draw-engine.ts` — random draw produces 5 unique numbers in range; weighted respects frequency
- [ ] `lib/prize-pool.ts` — correct 40/35/25 splits; equal division with multiple winners; jackpot carry
- [ ] Score rolling trigger — insert 6th score, verify exactly 5 remain and oldest is removed
- [ ] `matchTier` — all levels (5, 4, 3, null) tested with known inputs

### 12.2 Integration Tests
- [ ] Stripe webhook → `subscriptions` updated → middleware allows dashboard
- [ ] Score insert → rolling trigger fires → exactly 5 rows remain
- [ ] Draw publish → `draw_entries` created → `winners` rows created → emails triggered

### 12.3 E2E Checklist (manual or Playwright)
- [ ] Full signup → login → subscribe (Stripe test card) → charity selected → dashboard loads
- [ ] Add 5 scores; add 6th; verify oldest replaced and count stays at 5
- [ ] Admin: create draw → simulate (verify preview shown) → publish; verify winner rows in DB
- [ ] Winner: submit proof → admin approves → status shows "approved" → admin marks paid → status shows "paid"
- [ ] Lapsed subscription: middleware redirects `/dashboard/scores` → `/subscribe`
- [ ] Non-admin accessing `/admin` → redirected to `/dashboard`

### 12.4 Edge Cases to Verify
- [ ] User with < 5 scores at draw publish time — excluded; no `draw_entry` row created
- [ ] No 5-match winner — `jackpot_carry_out` saved; next draw's tier-5 pool includes it
- [ ] Multiple winners in same tier — prize divided equally; stored in pence to avoid float errors
- [ ] Subscription lapses mid-month — excluded from draw if not active at time of publish
- [ ] User changes charity after draw entry — `scores_snapshot` in `draw_entries` is immutable; not affected

### 12.5 Performance & Accessibility
- [ ] Test all pages at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Lighthouse targets: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Use `next/image` for all images — WebP conversion + lazy loading built in
- [ ] Use `next/font` — eliminates font-related layout shift (FOUT)
- [ ] No CLS on page load — reserve space for dynamic content with skeleton loaders

### 12.6 Security Checklist
- [ ] All `/api/*` routes verify session before responding — return 401 with no data if unauthenticated
- [ ] Admin API routes verify `role === 'admin'` server-side on every call, not just via middleware
- [ ] RLS policies tested: attempt cross-user queries in Supabase SQL editor — all blocked
- [ ] Stripe webhook verifies signature on every request — reject without valid signature
- [ ] File uploads: MIME type validated server-side by checking file bytes, not just extension
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never appears in any file under `app/(public)` or client components
- [ ] Env audit: `grep -r "SERVICE_ROLE" app/` must return zero results in client-accessible code

### 12.7 Final Deployment
- [ ] All environment variables confirmed in Vercel dashboard
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain
- [ ] Stripe webhook URL updated to `https://yourdomain.com/api/stripe/webhook`
- [ ] Supabase Auth → URL Configuration → Site URL and Redirect URLs updated to production domain
- [ ] Vercel Cron Jobs visible and active in Vercel dashboard (Settings → Cron Jobs)
- [ ] Run full E2E checklist against production URL with test Stripe card
- [ ] Save test credentials document: subscriber login + admin login

---

## Assumptions to Document in README

> Intentional decisions made where the PRD was ambiguous. Documenting these is itself an evaluation criterion.

- [ ] Draw eligibility requires exactly 5 scores entered — users with fewer are excluded from that month
- [ ] Weighted draw tallies global score frequency across all active users (not per-user history)
- [ ] Contribution percentage applies to the net subscription fee; VAT handling is out of scope for MVP
- [ ] Independent donation uses a Stripe Payment Link embedded on charity profile pages
- [ ] Jackpot carries forward indefinitely until a 5-match winner is found
- [ ] Score `played_on` date must be within the past 12 months — older dates rejected with validation error
- [ ] Admin cannot hard-delete users — only deactivate to preserve historical draw integrity
- [ ] Only one charity can be `is_featured = true` at a time — enforced in the admin API
- [ ] Proof rejection resets status to `awaiting` so the user can resubmit — reason shown to user
- [ ] Prize amounts calculated and stored in pence/cents (integers) to avoid floating point rounding errors
