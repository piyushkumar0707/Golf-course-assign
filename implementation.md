# Implementation Guide
## Golf Charity Subscription Platform · Next.js 14

> **Stack:** Next.js 14 (App Router) · TypeScript · Supabase · Stripe · Tailwind CSS · Vercel
> **Architecture:** Server Components by default · Client Components only where needed

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Authentication](#authentication)
5. [Subscription & Payments](#subscription--payments)
6. [Score Management](#score-management)
7. [Draw Engine](#draw-engine)
8. [Prize Pool Logic](#prize-pool-logic)
9. [Charity System](#charity-system)
10. [Winner Verification](#winner-verification)
11. [User Dashboard](#user-dashboard)
12. [Admin Dashboard](#admin-dashboard)
13. [API Routes](#api-routes)
14. [Middleware](#middleware)
15. [Email Notifications](#email-notifications)
16. [UI/UX Guidelines](#uiux-guidelines)
17. [Deployment](#deployment)
18. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Frontend + Backend (API Routes) |
| Language | **TypeScript** | Type safety across the codebase |
| Styling | **Tailwind CSS** + **shadcn/ui** | UI components + utility-first CSS |
| Animation | **Framer Motion** | Micro-interactions and transitions |
| Database | **Supabase** (PostgreSQL) | Data persistence + Realtime |
| Auth | **Supabase Auth** | JWT-based authentication |
| Payments | **Stripe** | Subscriptions + webhooks |
| Storage | **Supabase Storage** | Winner proof uploads, charity images |
| Email | **Resend** + **React Email** | Transactional email notifications |
| Deployment | **Vercel** | Hosting + edge functions |
| Package Manager | **pnpm** | Fast, disk-efficient installs |

---

## Project Structure

```
golf-charity-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (public)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── charities/
│   │   │   ├── page.tsx                # Charity directory
│   │   │   └── [slug]/page.tsx         # Individual charity profile
│   │   └── how-it-works/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── layout.tsx              # Dashboard shell + sidebar
│   │       ├── page.tsx                # Dashboard overview
│   │       ├── scores/page.tsx         # Score entry & history
│   │       ├── draws/page.tsx          # Draw participation
│   │       ├── charity/page.tsx        # Charity selection
│   │       ├── winnings/page.tsx       # Winnings & payouts
│   │       └── settings/page.tsx       # Profile & subscription
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx              # Admin shell
│   │       ├── page.tsx                # Admin overview / analytics
│   │       ├── users/page.tsx
│   │       ├── draws/
│   │       │   ├── page.tsx            # Draw management
│   │       │   └── [id]/page.tsx       # Individual draw
│   │       ├── charities/page.tsx
│   │       ├── winners/page.tsx
│   │       └── reports/page.tsx
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts         # Stripe webhook handler
│   │   ├── scores/route.ts
│   │   ├── draws/
│   │   │   ├── route.ts
│   │   │   ├── simulate/route.ts
│   │   │   └── publish/route.ts
│   │   ├── charities/route.ts
│   │   ├── winners/
│   │   │   ├── route.ts
│   │   │   └── verify/route.ts
│   │   └── admin/
│   │       └── reports/route.ts
│   ├── layout.tsx                      # Root layout
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── shared/                         # Shared across app
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── SubscribeButton.tsx
│   ├── dashboard/                      # Dashboard-specific
│   │   ├── ScoreEntryForm.tsx          # Client Component
│   │   ├── ScoreList.tsx
│   │   ├── DrawCard.tsx
│   │   └── WinningsTable.tsx
│   └── admin/                          # Admin-specific
│       ├── DrawConfigurator.tsx
│       ├── UserTable.tsx
│       └── WinnerVerifier.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client
│   │   └── middleware.ts               # Supabase middleware helper
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── draw-engine/
│   │   ├── random.ts
│   │   ├── algorithmic.ts
│   │   └── prize-calculator.ts
│   ├── email/
│   │   └── templates/
│   │       ├── WelcomeEmail.tsx
│   │       ├── DrawResultEmail.tsx
│   │       └── WinnerAlertEmail.tsx
│   └── utils.ts
├── types/
│   ├── database.types.ts               # Auto-generated from Supabase
│   └── index.ts                        # App-level types
├── hooks/
│   ├── useSubscription.ts
│   ├── useScores.ts
│   └── useDraw.ts
├── middleware.ts                        # Route protection + subscription gate
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

---

## Database Schema

### Supabase (PostgreSQL) Tables

```sql
-- ─── USERS (extends Supabase auth.users) ───────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  charity_id      UUID REFERENCES charities(id),
  charity_percent NUMERIC(5,2) DEFAULT 10 CHECK (charity_percent >= 10),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  plan                 TEXT CHECK (plan IN ('monthly', 'yearly')),
  status               TEXT CHECK (status IN ('active', 'cancelled', 'lapsed', 'trialing')),
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── SCORES ────────────────────────────────────────────────────────────────
CREATE TABLE scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score      INT NOT NULL CHECK (score BETWEEN 1 AND 45),
  played_on  DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rolling window: enforce max 5 scores per user via trigger
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM scores
      WHERE user_id = NEW.user_id
      ORDER BY played_on DESC
      LIMIT 4  -- keep 4 after insert, total = 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER score_limit_trigger
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION enforce_score_limit();

-- ─── CHARITIES ─────────────────────────────────────────────────────────────
CREATE TABLE charities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── CHARITY EVENTS ────────────────────────────────────────────────────────
CREATE TABLE charity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charity_id  UUID REFERENCES charities(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  event_date  DATE,
  description TEXT
);

-- ─── DRAWS ─────────────────────────────────────────────────────────────────
CREATE TABLE draws (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month           DATE NOT NULL,          -- First day of draw month
  logic           TEXT CHECK (logic IN ('random', 'algorithmic')),
  drawn_numbers   INT[],                  -- Array of 5 numbers drawn
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  jackpot_amount  NUMERIC(10,2) DEFAULT 0,
  jackpot_rollover BOOLEAN DEFAULT false,
  prize_pool      JSONB,                  -- { five_match: X, four_match: Y, three_match: Z }
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── DRAW ENTRIES ──────────────────────────────────────────────────────────
CREATE TABLE draw_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id    UUID REFERENCES draws(id),
  user_id    UUID REFERENCES profiles(id),
  scores     INT[],                       -- Snapshot of user's 5 scores at draw time
  match_type TEXT CHECK (match_type IN ('5-match', '4-match', '3-match', 'no-match')),
  prize      NUMERIC(10,2) DEFAULT 0
);

-- ─── WINNERS ───────────────────────────────────────────────────────────────
CREATE TABLE winners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_entry_id   UUID REFERENCES draw_entries(id),
  user_id         UUID REFERENCES profiles(id),
  match_type      TEXT,
  prize_amount    NUMERIC(10,2),
  proof_url       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  reviewed_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── CHARITY CONTRIBUTIONS ─────────────────────────────────────────────────
CREATE TABLE charity_contributions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  charity_id  UUID REFERENCES charities(id),
  amount      NUMERIC(10,2),
  period      DATE,                       -- Month/year of contribution
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Authentication

Use **Supabase Auth** with the `@supabase/ssr` package for Next.js 14 App Router.

```typescript
// lib/supabase/server.ts — SERVER component client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}

// lib/supabase/client.ts — CLIENT component client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Sign-up flow
1. User fills signup form → Supabase `auth.signUp()`
2. On `auth.users` insert, a Supabase **trigger** auto-creates a `profiles` row
3. Redirect to Stripe Checkout for subscription selection
4. On successful Stripe payment, webhook sets `subscriptions.status = 'active'`

---

## Subscription & Payments

### Stripe Setup

```typescript
// lib/stripe/client.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

// Price IDs — store in env
// STRIPE_PRICE_MONTHLY=price_xxx
// STRIPE_PRICE_YEARLY=price_yyy
```

### Checkout Session (API Route)

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() // 'monthly' | 'yearly'
  const priceId = plan === 'monthly'
    ? process.env.STRIPE_PRICE_MONTHLY!
    : process.env.STRIPE_PRICE_YEARLY!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
```

### Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await supabase.from('subscriptions').upsert({
        user_id: session.metadata!.userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: session.metadata!.plan,
        status: 'active',
      })
      break
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: sub.status, current_period_end: new Date(sub.current_period_end * 1000).toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## Score Management

### Rolling 5-Score Logic

The database trigger (see schema) handles enforcement at the DB level. The API route:

```typescript
// app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch user's scores
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_on', { ascending: false })
    .limit(5)

  return NextResponse.json(data)
}

// POST — add a new score (trigger auto-removes oldest if > 5)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { score, played_on } = await req.json()

  // Validate
  if (score < 1 || score > 45) {
    return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, score, played_on })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

### Score Entry Form (Client Component)

```typescript
// components/dashboard/ScoreEntryForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ScoreEntryForm() {
  const router = useRouter()
  const [score, setScore] = useState('')
  const [playedOn, setPlayedOn] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/scores', {
      method: 'POST',
      body: JSON.stringify({ score: Number(score), played_on: playedOn }),
      headers: { 'Content-Type': 'application/json' },
    })
    setLoading(false)
    router.refresh() // Next.js 14: refresh Server Component data
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="number" min={1} max={45} value={score}
        onChange={e => setScore(e.target.value)}
        placeholder="Score (1–45)"
        className="input"
      />
      <input
        type="date" value={playedOn}
        onChange={e => setPlayedOn(e.target.value)}
        className="input"
      />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Saving…' : 'Add Score'}
      </button>
    </form>
  )
}
```

---

## Draw Engine

```typescript
// lib/draw-engine/random.ts
export function runRandomDraw(): number[] {
  const numbers = new Set<number>()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

// lib/draw-engine/algorithmic.ts
// Weighted draw: scores that appear most often are MORE likely to be drawn
export async function runAlgorithmicDraw(supabase: any): Promise<number[]> {
  const { data: scores } = await supabase
    .from('scores')
    .select('score')

  const frequency: Record<number, number> = {}
  scores?.forEach(({ score }: { score: number }) => {
    frequency[score] = (frequency[score] || 0) + 1
  })

  // Build weighted pool
  const pool: number[] = []
  for (let i = 1; i <= 45; i++) {
    const weight = frequency[i] ?? 1
    for (let w = 0; w < weight; w++) pool.push(i)
  }

  // Pick 5 unique from weighted pool
  const picked = new Set<number>()
  while (picked.size < 5) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.add(pool[idx])
  }

  return Array.from(picked).sort((a, b) => a - b)
}

// lib/draw-engine/prize-calculator.ts
export function calculateMatchType(
  drawnNumbers: number[],
  userScores: number[]
): '5-match' | '4-match' | '3-match' | 'no-match' {
  const matched = userScores.filter(s => drawnNumbers.includes(s)).length
  if (matched >= 5) return '5-match'
  if (matched >= 4) return '4-match'
  if (matched >= 3) return '3-match'
  return 'no-match'
}

export function calculatePrizePool(activeSubscribers: number, planRevenue: number) {
  const total = activeSubscribers * planRevenue
  return {
    five_match: total * 0.40,
    four_match: total * 0.35,
    three_match: total * 0.25,
  }
}
```

### Running a Draw (Admin API)

```typescript
// app/api/draws/publish/route.ts
export async function POST(req: NextRequest) {
  // 1. Admin auth check
  // 2. Get or create draw record for current month
  // 3. Run draw logic (random or algorithmic)
  // 4. Snapshot all active subscribers' scores into draw_entries
  // 5. Calculate match types for every entry
  // 6. Compute prize pools
  // 7. Check for 5-match winners — if none, rollover jackpot
  // 8. Create winners records for 3/4/5-match entries
  // 9. Set draw.status = 'published'
  // 10. Trigger email notifications
}
```

---

## Prize Pool Logic

```typescript
// lib/draw-engine/prize-calculator.ts

interface PrizePool {
  five_match: number
  four_match: number
  three_match: number
}

export function distributePrizes(
  pool: PrizePool,
  winners: { match_type: string }[],
  jackpotRollover: number
): Record<string, number> {
  const fiveMatchWinners = winners.filter(w => w.match_type === '5-match').length
  const fourMatchWinners = winners.filter(w => w.match_type === '4-match').length
  const threeMatchWinners = winners.filter(w => w.match_type === '3-match').length

  return {
    per_five_match: fiveMatchWinners > 0
      ? (pool.five_match + jackpotRollover) / fiveMatchWinners
      : 0, // Jackpot rolls over
    per_four_match: fourMatchWinners > 0
      ? pool.four_match / fourMatchWinners
      : 0,
    per_three_match: threeMatchWinners > 0
      ? pool.three_match / threeMatchWinners
      : 0,
    new_jackpot: fiveMatchWinners === 0
      ? (pool.five_match + jackpotRollover)
      : 0,
  }
}
```

---

## Charity System

### Charity Selection (Server Component)

```typescript
// app/(dashboard)/dashboard/charity/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function CharityPage() {
  const supabase = createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  // Render charity selection form
}
```

### Contribution Calculation

```typescript
// Calculated at draw/billing time
function calculateCharityContribution(
  subscriptionAmount: number,
  charityPercent: number // min 10
): number {
  return (subscriptionAmount * charityPercent) / 100
}
```

---

## Winner Verification

```typescript
// app/api/winners/verify/route.ts
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  // Admin auth check
  const { winnerId, action } = await req.json() // action: 'approve' | 'reject'

  await supabase
    .from('winners')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', winnerId)

  // If approved → queue payment + send email notification
}
```

### Proof Upload (Client Component)

```typescript
// components/dashboard/ProofUpload.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function ProofUpload({ winnerId }: { winnerId: string }) {
  const supabase = createClient()

  const handleUpload = async (file: File) => {
    const path = `winners/${winnerId}/${file.name}`
    await supabase.storage.from('winner-proofs').upload(path, file)
    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(path)
    // Update winners record with proof_url
    await fetch('/api/winners', {
      method: 'PATCH',
      body: JSON.stringify({ winnerId, proof_url: publicUrl }),
    })
  }
}
```

---

## User Dashboard

All dashboard pages are **Server Components** — data is fetched server-side. Only interactive elements (score entry form, charity picker) are Client Components.

```typescript
// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel data fetching
  const [
    { data: subscription },
    { data: scores },
    { data: profile },
    { data: recentDraws },
    { data: winnings },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('scores').select('*').eq('user_id', user.id).order('played_on', { ascending: false }).limit(5),
    supabase.from('profiles').select('*, charities(name)').eq('id', user.id).single(),
    supabase.from('draw_entries').select('*, draws(month, status)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('winners').select('*').eq('user_id', user.id),
  ])

  // Check active subscription gate
  if (subscription?.status !== 'active') redirect('/pricing?reactivate=true')

  return (
    <div>
      {/* Render dashboard widgets */}
    </div>
  )
}
```

---

## Admin Dashboard

```typescript
// app/(admin)/admin/page.tsx
// Reports & analytics — server-side aggregation

export default async function AdminPage() {
  const supabase = createClient()

  const [
    { count: totalUsers },
    { data: prizePoolData },
    { data: charityContributions },
    { data: drawStats },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('draws').select('prize_pool, jackpot_amount').eq('status', 'published'),
    supabase.from('charity_contributions').select('amount, charities(name)'),
    supabase.from('draws').select('month, status, drawn_numbers'),
  ])

  // Aggregate and render analytics
}
```

---

## API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/checkout` | User | Create Stripe Checkout session |
| POST | `/api/webhooks/stripe` | Stripe sig | Handle Stripe events |
| GET | `/api/scores` | User | Fetch user scores |
| POST | `/api/scores` | User | Add new score |
| DELETE | `/api/scores/[id]` | User | Delete a score |
| GET | `/api/draws` | User | List draws |
| POST | `/api/draws/simulate` | Admin | Simulate draw |
| POST | `/api/draws/publish` | Admin | Publish draw |
| GET | `/api/charities` | Public | List charities |
| POST | `/api/charities` | Admin | Create charity |
| PATCH | `/api/charities/[id]` | Admin | Update charity |
| GET | `/api/winners` | Admin | List winners |
| PATCH | `/api/winners/verify` | Admin | Approve/reject winner |
| GET | `/api/admin/reports` | Admin | Aggregated analytics |

---

## Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Unauthenticated → redirect to login
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Non-admin accessing admin panel
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```

---

## Email Notifications

```typescript
// lib/email/send.ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDrawResultEmail(to: string, drawData: any) {
  await resend.emails.send({
    from: 'Golf Charity Platform <draws@yourdomain.com>',
    to,
    subject: `Draw Results — ${drawData.month}`,
    react: DrawResultEmail(drawData),
  })
}
```

### Email Triggers
| Event | Template |
|---|---|
| User signup | `WelcomeEmail` |
| Subscription activated | `SubscriptionConfirmedEmail` |
| Draw published | `DrawResultEmail` (to all participants) |
| User wins | `WinnerAlertEmail` |
| Winner proof approved | `PaymentPendingEmail` |
| Winner paid | `PaymentConfirmedEmail` |
| Subscription renewal | `RenewalReminderEmail` |

---

## UI/UX Guidelines

### Design Principles (Next.js 14 specific)

- Use **Server Components** for all static/data-driven UI (no client hydration cost)
- Use `'use client'` only for: forms, modals, animations, interactive state
- Use `next/image` for all images (optimised, WebP, lazy-loaded)
- Use `next/font` for typography (zero layout shift)

### Recommended Libraries

```bash
pnpm add framer-motion          # Page transitions & micro-animations
pnpm add @radix-ui/react-dialog # Accessible modals
pnpm add recharts               # Analytics charts (admin)
pnpm add react-hot-toast        # Toast notifications
pnpm add lucide-react           # Icon set
```

### Animation Pattern

```typescript
// components/shared/FadeIn.tsx
'use client'
import { motion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Deployment

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy (use a NEW Vercel account per PRD requirements)
vercel --prod
```

### Vercel Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "regions": ["bom1"],
  "functions": {
    "app/api/webhooks/stripe/route.ts": {
      "maxDuration": 30
    },
    "app/api/draws/publish/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run all SQL schema migrations via the Supabase SQL editor
3. Enable Row Level Security (RLS) on all tables
4. Configure Storage buckets: `winner-proofs`, `charity-images`
5. Set up Auth redirect URLs in the Supabase dashboard

### RLS Policies (critical examples)

```sql
-- Users can only read/write their own scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_own" ON scores
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Winners readable by owner and admins
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "winners_owner_or_admin" ON winners
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Server-only, never expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_yyy

# App
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

---

## Next.js 14 Key Patterns

| Pattern | Usage in this project |
|---|---|
| **App Router** | All pages use `app/` directory |
| **Server Components** | Default for all pages and layouts — data fetching without API calls |
| **Client Components** | `'use client'` only for forms, modals, animations |
| **Route Handlers** | `app/api/**/route.ts` for REST endpoints |
| **Middleware** | Auth + subscription gate on protected routes |
| **Server Actions** | Optional — can replace some API routes for form submissions |
| **`router.refresh()`** | Invalidate Server Component cache after mutations |
| **`next/image`** | All images — automatic WebP conversion + lazy loading |
| **`next/font`** | Google fonts or local — zero layout shift |
| **Parallel Data Fetching** | `Promise.all()` in Server Components for performance |
| **Streaming** | `<Suspense>` boundaries for progressive loading on dashboard |

---

*Implementation guide for Digital Heroes Golf Charity Platform · Next.js 14 · March 2026*
