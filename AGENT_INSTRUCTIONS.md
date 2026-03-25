# Agent Instructions — Golf Charity Subscription Platform
> Read this file in full before writing a single line of code.
> Follow every rule here exactly. Do not improvise on stack, structure, or naming.

---

## 1. What You Are Building

A subscription-based web application where users:
- Subscribe (monthly or yearly) via Stripe
- Enter their last 5 golf scores in Stableford format (1–45)
- Participate in monthly prize draws (3/4/5-number match tiers)
- Donate a portion of their subscription to a charity of their choice

There are three user roles: **Public Visitor**, **Registered Subscriber**, and **Administrator**.

---

## 2. Stack — No Deviations

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth + Storage | Supabase (new project — not personal) |
| Payments | Stripe (Checkout + Billing Portal + Webhooks) |
| Email | Resend |
| Deployment | Vercel (new account — not personal) |
| Animation | Framer Motion |

Do **not** introduce any other libraries without a clear reason. Do not use `pages/` router. Do not use `getServerSideProps`.

---

## 3. Folder Structure

Maintain this exact structure. Do not reorganise it.

```
/
├── app/
│   ├── (auth)/              # login, signup, forgot-password, reset-password
│   ├── (public)/            # home, about, charities, draws, how-it-works
│   ├── dashboard/           # protected subscriber area
│   ├── admin/               # protected admin area
│   ├── subscribe/           # subscription + charity selection flow
│   └── api/
│       ├── stripe/
│       ├── scores/
│       ├── draws/
│       ├── charities/
│       ├── winners/
│       ├── admin/
│       └── cron/
├── components/              # shared UI components
├── lib/
│   ├── supabase/
│   │   ├── server.ts        # createServerClient from @supabase/ssr
│   │   └── browser.ts       # createBrowserClient singleton
│   ├── stripe.ts
│   ├── draw-engine.ts       # pure draw logic — no DB calls
│   ├── prize-pool.ts        # pure prize calculations — no DB calls
│   └── mailer.ts            # Resend wrapper
├── middleware.ts             # global auth + subscription gating
├── types/                   # shared TypeScript interfaces
└── supabase/
    └── migrations/          # all schema migrations
```

---

## 4. Environment Variables

Set all of the following in `.env.local` and in the Vercel dashboard before running anything.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # server-side only — NEVER in client components

STRIPE_SECRET_KEY                  # server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_YEARLY

RESEND_API_KEY

CRON_SECRET                        # protect cron routes
NEXT_PUBLIC_SITE_URL               # production domain
```

**Hard rule:** Run `grep -r "SERVICE_ROLE" app/` before every deployment. It must return zero results.

---

## 5. Database Schema

Create all tables via migration files in `/supabase/migrations/`. Apply with `supabase db push`. Never manually edit tables in the Supabase dashboard.

### Tables

**`profiles`** — extends `auth.users`
```sql
id uuid references auth.users primary key,
full_name text,
role text default 'subscriber',         -- 'subscriber' | 'admin'
subscription_status text default 'inactive',
created_at timestamptz default now()
```

**`subscriptions`**
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references profiles(id),
stripe_customer_id text unique,
stripe_subscription_id text unique,
plan text,                              -- 'monthly' | 'yearly'
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
events jsonb,                           -- [{title, date, description}]
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
draw_type text,                         -- 'random' | 'weighted'
status text default 'pending',          -- 'pending' | 'simulated' | 'published'
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
scores_snapshot integer[],              -- immutable — never update after insert
tier_matched integer,                   -- 3, 4, 5, or null
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
prize_amount numeric,                   -- stored in pence/cents (integer arithmetic only)
proof_url text,
proof_status text default 'awaiting',   -- 'awaiting' | 'pending' | 'approved' | 'rejected'
payment_status text default 'unpaid',   -- 'unpaid' | 'paid'
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

### Database Triggers (create before proceeding to Phase 2)

**Score rolling trigger:** On every INSERT to `scores`, if the user now has more than 5 rows, delete the oldest by `created_at`. Test this in the Supabase SQL editor before moving on — insert 6 scores, confirm exactly 5 remain.

**Profile creation trigger:** On INSERT to `auth.users`, auto-insert a matching row in `profiles`. Test by creating a user and checking the `profiles` table.

### Row Level Security

Enable RLS on every table. Policy summary:

| Table | User Policy | Admin Policy |
|---|---|---|
| `profiles` | read/update own row | read all |
| `subscriptions` | read own | service role writes only |
| `scores` | full CRUD own | update any |
| `charities` | read (authenticated) | full write |
| `user_charity` | read/update own | — |
| `draws` | read published | full write |
| `draw_entries` | read own | read all |
| `winners` | read own | read/update all |
| `prize_pool` | read all | service role writes |
| `audit_log` | none | read only |

Test cross-user queries in the Supabase SQL editor. All attempts must be blocked.

---

## 6. Middleware Rules

`middleware.ts` runs on every matched request via the Next.js edge runtime.

```
No session + /dashboard/* or /admin/*     → redirect /login
Not admin + /admin/*                       → redirect /dashboard
Subscription inactive + /dashboard/*      → redirect /subscribe
  Exception: /dashboard/settings always passes through (let lapsed users manage billing)
Public routes                              → always pass through
```

Refresh the Supabase session cookie on every request (required by `@supabase/ssr`).

---

## 7. Core Business Logic

### Score Rules
- Only the latest 5 scores are kept per user (enforced by DB trigger)
- Score range: integers 1–45 only
- `played_on` must not be in the future and must be within the last 12 months
- Scores display in reverse chronological order (most recent first)
- Users with fewer than 5 scores at draw publish time are **excluded** from that draw

### Draw Engine (`lib/draw-engine.ts`)
Write as pure functions — no database calls inside this file.

```ts
randomDraw(): number[]
// Returns 5 unique random integers between 1–45

weightedDraw(allScores: number[]): number[]
// Tallies frequency across ALL active users' scores (not per user)
// Weighted random selection — returns 5 unique numbers

matchTier(userScores: number[], drawn: number[]): 3 | 4 | 5 | null
// Returns highest match count if >= 3, otherwise null
```

Unit test all three functions. Edge cases: ties in weighted, no matches, exact 5-match.

### Prize Pool (`lib/prize-pool.ts`)
Write as pure functions — no database calls.

```ts
calculatePool(subscriberCount, pricePerUser, jackpotCarryIn)
// Returns { tier5, tier4, tier3 } using 40/35/25 split

splitPrize(tierPool, winnerCount): number
// Equal division — use integer arithmetic (pence) to avoid float errors

shouldCarryJackpot(tier5Winners: number): boolean
```

**Prize distribution:**

| Tier | Pool Share | Rollover |
|---|---|---|
| 5-Number Match | 40% | Yes — jackpot carries forward |
| 4-Number Match | 35% | No |
| 3-Number Match | 25% | No |

- Jackpot carries forward indefinitely until a 5-match winner is found
- Multiple winners in the same tier split the pool equally
- All prize amounts stored in pence (integers) — never use float arithmetic for money

### Charity Contribution
- Minimum: 10% of subscription fee
- User can increase up to 100%
- Percentage applies to net subscription fee (VAT out of scope)
- Independent donation: Stripe Payment Link embedded on charity profile pages

---

## 8. Stripe Integration

### Checkout flow
1. User selects plan on `/subscribe`
2. Frontend POSTs to `/api/stripe/create-checkout`
3. Server creates/retrieves Stripe customer, creates Checkout Session
4. Returns `{ url }` — frontend redirects to it
5. On success, Stripe fires `checkout.session.completed` webhook

### Webhook handler (`/api/stripe/webhook`)
- Read raw body with `request.text()` — required for signature verification
- Verify: `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
- Handle these four events:

| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert `subscriptions`, set `profiles.subscription_status = 'active'` |
| `customer.subscription.updated` | Update status + `current_period_end` |
| `customer.subscription.deleted` | Set status `cancelled`, `subscription_status = 'inactive'` |
| `invoice.payment_failed` | Set status `lapsed`, trigger lapsed email |

- All DB writes in the webhook handler use the **service role** Supabase client
- Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 9. Winner Verification Flow

States: `awaiting` → `pending` → `approved` / `rejected` → `paid`

1. Draw published → `winners` rows created → winner notification emails sent
2. User sees proof upload section in dashboard (only when `proof_status = 'awaiting'`)
3. User uploads screenshot (PNG/JPG/PDF, max 5MB) → saved to Supabase Storage `winner-proofs/` bucket
4. Status set to `pending` — upload disabled until resolved
5. Admin reviews: approve → `approved` (email sent), or reject with reason → back to `awaiting` (user can resubmit)
6. Admin marks paid → `payment_status = 'paid'` → payment confirmation email

---

## 10. Email Triggers

All emails sent via `lib/mailer.ts` (Resend wrapper). Every function must be typed.

| Trigger | When |
|---|---|
| Welcome | After signup |
| Subscription confirmed | `checkout.session.completed` webhook |
| Draw reminder | Cron job — 2 days before end of month |
| Draw results | On draw publish — personalised (user's scores vs winning numbers) |
| Winner notification | On draw publish — includes tier, prize, proof upload link |
| Proof received | User submits proof |
| Proof approved | Admin approves |
| Proof rejected | Admin rejects — includes reason + re-upload link |
| Payment sent | Admin marks as paid |
| Renewal reminder | Cron job — 3 days before `current_period_end` |
| Subscription lapsed | `invoice.payment_failed` webhook |

### Cron Jobs (`vercel.json`)
```json
{
  "crons": [
    { "path": "/api/cron/draw-reminder", "schedule": "0 9 28 * *" },
    { "path": "/api/cron/renewal-reminder", "schedule": "0 9 * * *" }
  ]
}
```
Protect every cron route: verify `Authorization: Bearer ${CRON_SECRET}` header.

---

## 11. UI / UX Rules

These are non-negotiable design constraints from the PRD.

- **Do not make this look like a golf website.** No fairway images, plaid, or golf club motifs as primary design language.
- Lead with **charitable impact** on the homepage — not sport.
- Homepage must clearly communicate: what the user does, how they win, charity impact, and a prominent CTA.
- Use Framer Motion for scroll-triggered animations and micro-interactions.
- Mobile-first — test at 375px, 768px, and 1280px.
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90.
- Use `next/image` for all images (WebP + lazy loading).
- Use `next/font` to eliminate font layout shift.
- Reserve space for dynamic content with skeleton loaders — no CLS on load.

---

## 12. Admin Dashboard Requirements

The admin panel must cover all of the following — every item is required:

**User Management**
- Paginated user table (25/page) with search by name/email
- Individual user page: profile, subscription, scores, charity, draw/win history
- Subscription status override
- Score edit with audit log entry on every change

**Draw Management**
- List of all draws with status badges
- Create draw: pick month/year + draw type (random vs weighted)
- Simulate draw: preview results without writing to DB
- Publish draw: confirmation modal ("This cannot be undone") → irreversible
- Individual draw page: winning numbers, tier breakdown, full winner list

**Charity Management**
- List with edit / toggle-featured / soft-delete actions
- Create and edit forms with image upload to Supabase Storage
- Only one charity can be `is_featured = true` at a time — enforced at API level
- Never hard-delete charities — only `is_active = false`

**Winners Management**
- Filterable by draw and payment status
- Inline proof preview (image or PDF iframe via Supabase signed URL)
- Approve / Reject / Mark as paid actions

**Reports & Analytics**
- Live stats: active subscribers, current prize pool, total donated
- Draw history: match rates per tier, jackpot history
- CSV export endpoint: `GET /api/admin/reports/export?type=users|winners|draws`

---

## 13. Security Checklist

Run through this before every deployment:

- [ ] Every `/api/*` route verifies session — returns 401 with no data if unauthenticated
- [ ] Admin API routes verify `role === 'admin'` server-side on every call (not just middleware)
- [ ] RLS policies tested: cross-user queries blocked in Supabase SQL editor
- [ ] Stripe webhook verifies signature on every request
- [ ] File uploads: MIME type validated server-side by checking file bytes, not extension
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never appears in any client component or public route
- [ ] `grep -r "SERVICE_ROLE" app/` returns zero results

---

## 14. Edge Cases to Handle

These are known ambiguous scenarios. Implement them exactly as stated.

| Scenario | Behaviour |
|---|---|
| User has < 5 scores at draw time | Excluded from draw — no `draw_entry` row created |
| No 5-match winner | `jackpot_carry_out` saved; next draw's tier-5 pool includes it |
| Multiple winners in same tier | Prize split equally; stored in pence to avoid float errors |
| Subscription lapses mid-month | Excluded from draw if not active at time of publish |
| User changes charity after entering draw | `scores_snapshot` in `draw_entries` is immutable — not affected |
| Proof rejected | Status resets to `awaiting`; user can resubmit; rejection reason shown |
| Admin deletes user | Not allowed — only deactivate to preserve draw history |
| Score `played_on` > 12 months ago | Reject with validation error |
| Featured charity toggle | Unsetting others enforced in admin API — only one at a time |

---

## 15. Deployment Checklist

Run through this in order before submitting:

- [ ] All environment variables confirmed in Vercel dashboard
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain
- [ ] Stripe webhook URL updated to `https://yourdomain.com/api/stripe/webhook`
- [ ] Supabase Auth → URL Configuration → Site URL and Redirect URLs updated to production domain
- [ ] Vercel Cron Jobs active (Settings → Cron Jobs)
- [ ] Full E2E test against production URL using Stripe test card
- [ ] Test credentials document saved: subscriber login + admin login
- [ ] `grep -r "SERVICE_ROLE" app/` returns zero results

---

## 16. Deliverables

You must produce all six of these — partial submissions will not be accepted.

| Deliverable | Requirement |
|---|---|
| Live Website | Fully deployed, publicly accessible URL |
| User Panel | Test credentials; signup / login / score entry / dashboard all functional |
| Admin Panel | Admin credentials; user management, draw system, charities, winner verification |
| Database | Supabase backend with correct schema and RLS applied |
| Source Code | Clean, structured, well-commented |
| README | Documents all assumptions made where PRD was ambiguous |

---

## 17. Assumptions to Document in README

The following decisions have been made on ambiguous PRD points. Document them all in the README.

- Draw eligibility requires exactly 5 scores — users with fewer are excluded
- Weighted draw tallies global score frequency across all active users (not per-user)
- Contribution percentage applies to net subscription fee — VAT out of scope
- Independent donation uses a Stripe Payment Link on charity profile pages
- Jackpot carries forward indefinitely until a 5-match winner is found
- Score `played_on` must be within the last 12 months — older dates rejected
- Admins cannot hard-delete users — only deactivate
- Only one charity can be `is_featured = true` at a time
- Proof rejection resets status to `awaiting` so the user can resubmit
- Prize amounts stored in pence/cents (integers) to prevent floating point errors
