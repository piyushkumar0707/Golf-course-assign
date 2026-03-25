# ISSUE REPORT - Golf Charity Platform

## Audit Scope
- Codebase reviewed against Objective.md PRD requirements.
- Static review performed across user panel, admin panel, API routes, middleware, Supabase schema/migrations, and UX consistency.
- This report focuses on actionable bugs, requirement gaps, and UI/UX polish items before submission.

## Severity Legend
- Critical: likely breakage, security, or major flow failure.
- High: important feature unreliable/incomplete.
- Medium: behavior, correctness, or UX quality issues.
- Low: polish, consistency, lint-quality issues.

---

## 1) Critical Issues

### C1. API auth/session sync instability (recently fixed but must re-verify)
- Files: middleware.ts, src/app/api/**/route.ts
- Symptom: dashboard pages render, but API calls return 401, causing broken user flows.
- Evidence: repeated GET /api/* -> 401 in logs.
- Risk: users see partial dashboard and errors despite being logged in.
- Required fix status: matcher now includes /api/:path*; must regression test all dashboard API calls.

### C2. Draw publish path can fail due RLS policy gaps (insert permissions missing)
- Files: src/supabase/migrations/001_initial_schema.sql, src/app/api/admin/draws/publish/route.ts
- Symptom: publish route inserts into draw_entries, prize_pool, winners.
- Schema issue:
  - draw_entries only has SELECT policies, no INSERT policy.
  - prize_pool only has SELECT policy, no INSERT policy.
  - winners has SELECT/UPDATE policies, no INSERT policy.
- Risk: draw publication fails in production even for admin.
- Required fix: add explicit admin INSERT policies or perform draw persistence with service-role backend.

### C3. Sign-out/session invalidation race can leave stale auth state
- Files: src/app/dashboard/layout.tsx, src/app/api/auth/signout/route.ts
- Symptom: signout previously acted like placeholder; session/cache desync observed.
- Current status: improved with server signout + redirects. Needs full regression test on all tabs/windows and refresh behavior.
- Risk: auth confusion and accidental protected route access UI state.

### C4. Webhook + subscription status consistency risk
- Files: src/app/api/stripe/webhook/route.ts
- Symptom: customer.subscription.updated updates subscriptions.status but does not sync profiles.subscription_status.
- Risk: middleware gating uses profiles.subscription_status and may remain stale.
- Required fix: map Stripe status -> profile subscription_status in updated/deleted/failed handlers consistently.

---

## 2) High Issues

### H1. Dashboard/charity/winnings pages assume JSON on non-JSON errors
- Files:
  - src/app/dashboard/page.tsx
  - src/app/dashboard/charity/page.tsx
  - src/app/dashboard/winnings/page.tsx
  - src/components/ScoreEntry.tsx
- Symptom: json() called on plain text "Unauthorized" -> browser SyntaxError.
- Risk: user-facing crashes and blank states.
- Required fix: centralized fetch helper with response.ok/response.status checks before json().

### H2. Admin overview uses mocked analytics (not real data)
- File: src/app/admin/page.tsx
- Symptom: setTimeout mock stats and placeholder charts.
- Risk: fails PRD Admin Analytics requirement and appears unfinished.
- Required fix: replace with real API-backed metrics + real charts.

### H3. Public footer links route to missing pages
- File: src/app/(public)/layout.tsx
- Missing routes:
  - /privacy
  - /terms
  - /contact
- Risk: obvious broken links during review.
- Required fix: add pages or remove links before submission.

### H4. Auth callback fallback route missing
- File: src/app/api/auth/callback/route.ts
- Symptom: redirects to /auth/auth-code-error, page not present.
- Risk: broken password-reset/login callback error flow.
- Required fix: add error page route or redirect to /login with message.

### H5. Admin user email retrieval likely broken by invalid relation
- Files:
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/winners/route.ts
- Symptom: queries use auth_users!inner(email) relation, not defined in migration.
- Existing fallback in users route is partial and loses email data.
- Risk: key admin screens missing user emails or inconsistent results.
- Required fix: use auth.admin API with service-role or create DB view exposing needed email fields.

### H6. Charity direct donation CTA is non-functional
- File: src/app/(public)/charities/[id]/page.tsx
- Symptom: "Direct Donation" points to #.
- Risk: PRD independent donation supported requirement not met.
- Required fix: add actual donation flow or remove CTA.

---

## 3) Medium Issues (Logic, Data, Reliability)

### M1. Draw simulation/publish computes pool from all active subscribers, not eligible players
- Files:
  - src/app/api/admin/draws/simulate/route.ts
  - src/app/api/admin/draws/publish/route.ts
- Symptom: uses profiles.length for pool, while eligibility requires 5 scores.
- Risk: prize pool may be overstated and inconsistent with entry rules.
- Required fix: base pool on eligibleUsers.length or documented business rule.

### M2. Hardcoded subscription amount in draw logic
- Files:
  - src/app/api/admin/draws/simulate/route.ts
  - src/app/api/admin/draws/publish/route.ts
- Symptom: pricePerUser hardcoded to 1000.
- Risk: yearly plan and pricing changes not reflected.
- Required fix: derive pool from actual billing/subscription records.

### M3. Prize-pool logic may not match PRD expectation
- File: src/lib/prize-pool.ts
- Symptom: totalPool = 50% of subscription revenue, then 40/35/25 split.
- Risk: business mismatch if PRD expects specific contribution ratio.
- Required fix: document and align calculation source-of-truth.

### M4. Storage policy over-permissive for proof files
- File: src/supabase/migrations/001_initial_schema.sql
- Symptom: "Users can read own proofs" policy checks only bucket_id; any authenticated user can read all objects in bucket.
- Risk: privacy/security issue for winner proof documents.
- Required fix: path-based ownership policy or signed URL access with admin-only review.

### M5. Admin score update route lacks validation and uses ambiguous actionType
- File: src/app/api/admin/scores/[id]/route.ts
- Symptom: parse/validation incomplete; actionType comment suggests unfinished design.
- Risk: invalid score/date writes and audit inconsistency.
- Required fix: enforce same validations as user score API.

### M6. Settings page does not preload current profile values
- File: src/app/dashboard/settings/page.tsx
- Symptom: blank form on load, no initial user data.
- Risk: poor UX and accidental overwrite confusion.
- Required fix: fetch and prefill full_name/email + loading and success states.

### M7. Inconsistent error handling and user feedback patterns
- Files: many client pages (alert/confirm/prompt usage)
- Symptom: native dialogs mixed with inline UI patterns.
- Risk: unpolished submission UX.
- Required fix: replace with consistent toast/banner modal components.

---

## 4) UI/UX Gaps To Make App More Impressive

### UX1. Visual system inconsistency between sections
- Files: auth pages, dashboard pages, admin pages, subscribe pages
- Issue: mixed design languages (dark glass auth, light dashboard cards, old gray subscribe forms, admin neon style).
- Improvement:
  - define one design system (typography, spacing, radius, color tokens, button states)
  - unify page headers, card hierarchy, empty states, and form controls.

### UX2. Admin pages still look like internal tools, not polished product
- Files: src/app/admin/page.tsx, src/app/admin/users/page.tsx, src/app/admin/winners/page.tsx, src/app/admin/draws/page.tsx
- Issue: placeholders, basic tables, raw IDs in draw details.
- Improvement:
  - real KPI cards with trend deltas,
  - better table density and filters,
  - draw detail visual timeline,
  - winner review panel with side-by-side proof + actions.

### UX3. Public marketing quality not fully PRD-level
- Files: src/app/(public)/page.tsx, src/app/(public)/how-it-works/page.tsx, src/app/(public)/charities/*
- Issue: multiple "visualization placeholder" blocks and missing media quality.
- Improvement:
  - replace placeholders with real imagery/illustrations,
  - add trust section (impact counters, testimonials with real metadata),
  - improve CTA continuity from home -> subscribe -> dashboard.

### UX4. Missing resilient empty/error/loading states
- Files: dashboard/*, admin/*, ScoreEntry component
- Issue: many pages only show plain text loaders or silent console errors.
- Improvement:
  - skeleton loading,
  - retry actions,
  - graceful 401/500 banners,
  - no raw exception stack in browser.

### UX5. Accessibility and semantics improvements needed
- Files: many interactive pages
- Issue:
  - links used as buttons in some places,
  - missing form descriptions/help text,
  - color contrast risk in some badges,
  - native dialogs for critical actions.
- Improvement:
  - ARIA labels/roles, keyboard focus states, consistent semantic controls.

---

## 5) PRD Coverage Review (Objective.md)

### Core Functional Coverage
- Subscription Engine: Partial
  - Stripe checkout + webhook implemented.
  - Gaps: robust lifecycle sync, cancellation/lapse consistency, better status UX.
- Score Experience: Partial to Good
  - Score CRUD + validation + rolling trigger present.
  - Gaps: UX polish and consistent error handling.
- Draw Engine: Partial
  - Random/weighted logic, simulation and publish routes exist.
  - Gaps: RLS insert blockers + pool calculation assumptions.
- Charity Integration: Partial
  - Charity selection and listing implemented.
  - Gaps: direct donation flow missing, search/filter missing on public directory.
- Admin Control: Partial
  - Core screens and APIs exist.
  - Gaps: mock analytics, brittle joins, no robust moderation workflow UX.
- UI/UX Standout: Partial
  - Some modern sections exist.
  - Gaps: inconsistency, placeholders, incomplete polished flow.

### Mandatory Deliverables Status
- Public site: Implemented (needs polish + broken links fix)
- User panel (signup/login/score/dashboard): Implemented (needs auth edge-case hardening)
- Admin panel: Implemented (needs real analytics and data robustness)
- Backend schema + APIs: Implemented (RLS and data-policy gaps remain)
- Source quality: Partial (inconsistent patterns and placeholder code remain)

---

## 6) Quick Win Checklist Before Submission

1. Fix all Critical issues C1-C4 and re-test auth/session flows end-to-end.
2. Add missing INSERT RLS policies for draw publication tables (or service-role execution path).
3. Replace mock admin analytics with real API data.
4. Add missing routes: /privacy, /terms, /contact, /auth/auth-code-error.
5. Implement robust fetch helper for all dashboard/admin pages to handle non-JSON and 401/500.
6. Remove remaining placeholder content and native alert/confirm/prompt dialogs.
7. Fix current compile warnings (Tailwind class conflicts and utility migrations).
8. Run full regression checklist from Objective.md testing section.

---

## 7) Existing Compiler/Quality Warnings To Clean
- tsconfig.json: enable forceConsistentCasingInFileNames.
- src/app/(auth)/layout.tsx: migrate bg-gradient-to-* to bg-linear-to-* (Tailwind v4 consistency).
- src/app/(public)/draws/[id]/page.tsx: duplicate py-4/py-6 classes.
- src/app/dashboard/winnings/page.tsx: duplicate text-sm/text-lg and max-w utility warning.

---

## Final Recommendation
- The app is close to a strong submission but not yet "submission-safe" for production-style review.
- Prioritize Critical + High items first (auth/session reliability, RLS inserts, mock analytics removal, broken links).
- After that, execute focused UI polish pass for consistency and premium feel.
