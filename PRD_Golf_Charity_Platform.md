# Product Requirements Document
## Golf Charity Subscription Platform

> **Issued by:** Digital Heroes · digitalheroes.co.in
> **Version:** 1.0 · March 2026
> **Stack:** Next.js 14 (App Router) · Supabase · Stripe · Vercel

---

## 01 · Project Overview

A subscription-driven web application combining **golf performance tracking**, **charity fundraising**, and a **monthly draw-based reward engine**. The platform is designed to feel emotionally engaging and modern — deliberately avoiding the aesthetics of a traditional golf website.

### What Users Do
- Subscribe to the platform (monthly or yearly)
- Enter their latest golf scores in Stableford format
- Participate in monthly draw-based prize pools
- Support a charity of their choice with a portion of their subscription

---

## 02 · Core Objectives

| Objective | Description |
|---|---|
| Subscription Engine | Robust subscription and payment system via Stripe |
| Score Experience | Simple, engaging score-entry flow |
| Custom Draw Engine | Algorithm-powered or random monthly draws |
| Charity Integration | Seamless charity contribution logic |
| Admin Control | Comprehensive admin dashboard and tools |
| Outstanding UI/UX | Design that stands out in the golf industry |

---

## 03 · User Roles

### Public Visitor
- View platform concept
- Explore listed charities
- Understand draw mechanics
- Initiate subscription

### Registered Subscriber
- Manage profile & settings
- Enter / edit golf scores
- Select charity recipient
- View participation & winnings history
- Upload winner proof

### Administrator
- Manage users & subscriptions
- Configure & run draws
- Manage charity listings
- Verify winners & payouts
- Access reports & analytics

---

## 04 · Subscription & Payment System

| Attribute | Detail |
|---|---|
| Plans | Monthly plan and Yearly plan (discounted rate) |
| Gateway | Stripe (PCI-compliant) |
| Access Control | Non-subscribers receive restricted access |
| Lifecycle | Handles renewal, cancellation, and lapsed states |
| Validation | Real-time subscription status check on every authenticated request |

**Implementation Notes (Next.js 14):**
- Stripe webhooks handled via `app/api/webhooks/stripe/route.ts`
- Subscription state stored in Supabase `subscriptions` table
- Middleware (`middleware.ts`) validates session + subscription on every protected route

---

## 05 · Score Management System

### Input Requirements
- Users must enter their **last 5 golf scores**
- Score range: **1 – 45** (Stableford format)
- Each score must include a **date**

### Functional Behaviour
- Only the latest 5 scores are retained at any time
- A new score **replaces the oldest** stored score automatically
- Scores are displayed in **reverse chronological order** (most recent first)

---

## 06 · Draw & Reward System

### Draw Types
- 5-Number Match
- 4-Number Match
- 3-Number Match

### Draw Logic Options
- **Random generation** — standard lottery-style draw
- **Algorithmic** — weighted by most/least frequent user scores

### Operational Requirements
- Monthly cadence — draws executed once per month
- Admin controls publishing of draw results
- Simulation / pre-analysis mode before official publish
- Jackpot rollover to next month if no 5-match winner

---

## 07 · Prize Pool Logic

| Match Type | Pool Share | Rollover? |
|---|---|---|
| 5-Number Match | 40% | ✅ Yes (Jackpot) |
| 4-Number Match | 35% | ❌ No |
| 3-Number Match | 25% | ❌ No |

- Auto-calculation of each pool tier based on active subscriber count
- Prizes split equally among multiple winners in the same tier
- 5-Match jackpot carries forward if unclaimed

---

## 08 · Charity System

### Contribution Model
- Users select a charity at signup
- Minimum contribution: **10% of subscription fee**
- Users may voluntarily increase their charity percentage
- Independent donation option (not tied to gameplay)

### Charity Directory Features
- Charity listing page with search and filter
- Individual charity profiles: description, images, upcoming events (e.g. golf days)
- Featured / spotlight charity section on homepage

---

## 09 · Winner Verification System

| Step | Detail |
|---|---|
| Eligibility | Verification applies to winners only |
| Proof Upload | Screenshot of scores from the golf platform |
| Admin Review | Approve or Reject submission |
| Payment States | Pending → Paid |

---

## 10 · User Dashboard

The user dashboard must include all of the following modules:

- ✅ Subscription status (active / inactive / renewal date)
- ✅ Score entry and edit interface
- ✅ Selected charity and contribution percentage
- ✅ Participation summary (draws entered, upcoming draws)
- ✅ Winnings overview: total won and current payment status

---

## 11 · Admin Dashboard

### User Management
- View and edit user profiles
- Edit golf scores
- Manage subscriptions

### Draw Management
- Configure draw logic (random vs. algorithm)
- Run simulations
- Publish results

### Charity Management
- Add, edit, delete charities
- Manage content and media

### Winners Management
- View full winners list
- Verify submissions
- Mark payouts as completed

### Reports & Analytics
- Total users
- Total prize pool
- Charity contribution totals
- Draw statistics

---

## 12 · UI / UX Requirements

> The platform must **not** resemble a traditional golf website. Design must be emotion-driven — leading with charitable impact, not sport.

| Attribute | Detail |
|---|---|
| Feel | Clean, modern, motion-enhanced interface |
| Avoid | Golf clichés (fairways, plaid, club imagery as primary design language) |
| Homepage | Communicates: what the user does, how they win, charity impact, and CTA |
| Animations | Subtle transitions and micro-interactions throughout |
| CTA | Subscribe button / flow must be prominent and persuasive |

---

## 13 · Technical Requirements

- **Framework:** Next.js 14 with App Router
- **Mobile-first**, fully responsive design
- **Fast performance** — optimised assets, minimal blocking resources
- **Authentication** — Supabase Auth (JWT-based), HTTPS enforced
- **Email notifications** — system updates, draw results, winner alerts (via Resend or similar)

---

## 14 · Scalability Considerations

- Architecture must support **multi-country expansion**
- Extensible to **teams / corporate accounts**
- **Campaign module** ready for future activation
- Codebase structured to support a **mobile app version** (shared API layer)

---

## 15 · Mandatory Deliverables

| Deliverable | Detail |
|---|---|
| Live Website | Fully deployed, publicly accessible URL |
| User Panel | Test credentials; signup / login / score entry / dashboard all functional |
| Admin Panel | Admin credentials; user management, draw system, charities, winner verification |
| Database | Supabase backend connected with proper schema |
| Source Code | Clean, structured, well-commented codebase |

### Deployment Constraints
- Deploy to a **new Vercel account** (not personal/existing)
- Use a **new Supabase project** (not personal/existing)
- Environment variables must be properly configured

---

## 16 · Evaluation Criteria

| Criterion | Description |
|---|---|
| Requirements Interpretation | How accurately the team translates requirements into features |
| System Design | Quality of architecture decisions and data modelling |
| UI/UX Creativity | Originality, polish, and emotional engagement |
| Data Handling | Accuracy of score logic, draw engine, and prize calculations |
| Scalability Thinking | Extensibility of the codebase and data structures |
| Problem-Solving | How ambiguous requirements are identified and resolved |

### Testing Checklist
- ✅ User signup & login
- ✅ Subscription flow (monthly and yearly)
- ✅ Score entry — 5-score rolling logic
- ✅ Draw system logic and simulation
- ✅ Charity selection and contribution calculation
- ✅ Winner verification flow and payout tracking
- ✅ User Dashboard — all modules functional
- ✅ Admin Panel — full control and usability
- ✅ Data accuracy across all modules
- ✅ Responsive design on mobile and desktop
- ✅ Error handling and edge cases

---

*Document prepared by Digital Heroes as a sample assignment for the Full-Stack Development Trainee Selection Process.*
*For queries, visit [digitalheroes.co.in](https://digitalheroes.co.in)*
