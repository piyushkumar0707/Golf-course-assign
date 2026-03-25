# Digital Heroes · PRD — Golf Charity Subscription Platform  
**SAMPLE · Selection Process Only · digitalheroes.co.in**

---

# Product Requirements Document (PRD)

**Project:** Golf Charity Subscription Platform  
**Issued By:** Digital Heroes · digitalheroes.co.in  
**Document Type:** Product Requirements Document (PRD)  
**Purpose:** Trainee Selection Process — Sample Assignment  
**Version:** 1.0 · March 2026  
**Audience:** Full-Stack Development Trainees / Applicants  

---

## Document Summary
This PRD outlines the complete product specification for a subscription-based golf platform combining performance tracking, monthly prize draws, and charitable giving.

It serves as the **single source of truth** for design, development, and evaluation. :contentReference[oaicite:0]{index=0}

---

# 01 PROJECT OVERVIEW

The platform is a **subscription-driven web application** combining:

- Golf performance tracking  
- Charity fundraising  
- Monthly draw-based reward engine  

It is designed to feel **emotionally engaging and modern**, avoiding traditional golf aesthetics.

### Users will:
- Subscribe (monthly or yearly)
- Enter golf scores in **Stableford format**
- Participate in **monthly prize draws**
- Support a **charity of their choice**

---

# 02 CORE OBJECTIVES

| Component | Description |
|----------|------------|
| Subscription Engine | Robust subscription & payment system |
| Score Experience | Simple, engaging score-entry flow |
| Draw Engine | Algorithm-powered or random monthly draws |
| Charity Integration | Seamless charity contribution logic |
| Admin Control | Full admin dashboard & tools |
| UI/UX | Standout design in golf industry |

---

# 03 USER ROLES

## Public Visitor
- View platform concept  
- Explore charities  
- Understand draw mechanics  
- Initiate subscription  

## Registered Subscriber
- Manage profile & settings  
- Enter / edit golf scores  
- Select charity  
- View participation & winnings  
- Upload winner proof  

## Administrator
- Manage users & subscriptions  
- Configure & run draws  
- Manage charities  
- Verify winners & payouts  
- Access analytics  

---

# 04 SUBSCRIPTION & PAYMENT SYSTEM

- **Plans:** Monthly & Yearly (discounted)
- **Gateway:** Stripe (or equivalent PCI-compliant)
- **Access Control:** Restricted access for non-subscribers
- **Lifecycle:** Renewal, cancellation, lapsed states
- **Validation:** Real-time status check per request

---

# 05 SCORE MANAGEMENT SYSTEM

## Input Requirements
- Last **5 golf scores**
- Range: **1–45 (Stableford)**
- Each score must include a **date**

## Functional Behaviour
- Only latest 5 scores retained
- New score replaces oldest automatically
- Display: **reverse chronological order**

---

# 06 DRAW & REWARD SYSTEM

## Draw Types
- 5-Number Match  
- 4-Number Match  
- 3-Number Match  

## Draw Logic Options
- Random (lottery-style)  
- Algorithmic (weighted by score frequency)

## Operational Requirements
- Monthly execution  
- Admin-controlled publishing  
- Simulation/pre-analysis mode  
- Jackpot rollover if no winner  

---

# 07 PRIZE POOL LOGIC

A portion of subscriptions contributes to the prize pool.

| Match Type | Pool Share | Rollover |
|------------|-----------|----------|
| 5-Number Match | 40% | Yes (Jackpot) |
| 4-Number Match | 35% | No |
| 3-Number Match | 25% | No |

### Rules:
- Auto-calculated based on active users  
- Equal split among winners  
- Jackpot carries forward if unclaimed  

---

# 08 CHARITY SYSTEM

## Contribution Model
- Charity selected at signup  
- Minimum: **10% of subscription**
- Optional increase allowed  
- Independent donations supported  

## Charity Directory Features
- Search & filter charities  
- Individual profiles (description, images, events)  
- Featured charity section  

---

# 09 WINNER VERIFICATION SYSTEM

- Applies only to winners  

| Step | Description |
|------|------------|
| Proof Upload | Screenshot of golf scores |
| Admin Review | Approve / Reject |
| Payment States | Pending → Paid |

---

# 10 USER DASHBOARD

Must include:

- Subscription status (active/inactive/renewal)
- Score entry & editing
- Charity selection & percentage
- Participation summary
- Winnings overview (total + payment status)

---

# 11 ADMIN DASHBOARD

## User Management
- View/edit profiles  
- Edit scores  
- Manage subscriptions  

## Draw Management
- Configure logic  
- Run simulations  
- Publish results  

## Charity Management
- Add/edit/delete charities  
- Manage content  

## Winners Management
- View winners  
- Verify submissions  
- Mark payouts  

## Reports & Analytics
- Total users  
- Prize pool  
- Charity contributions  
- Draw statistics  

---

# 12 UI / UX REQUIREMENTS

### Design Philosophy
- Emotion-driven  
- Charity-first, not sport-first  

### Guidelines
- Clean, modern, motion-enhanced  
- Avoid golf clichés  

### Homepage
Must clearly communicate:
- What user does  
- How they win  
- Charity impact  
- CTA  

### Other Requirements
- Subtle animations  
- Strong CTA (Subscribe)  

---

# 13 TECHNICAL & ADDITIONAL REQUIREMENTS

- Mobile-first responsive design  
- Fast performance (optimized assets)  
- Secure auth (JWT/session, HTTPS)  
- Email notifications:
  - Updates  
  - Draw results  
  - Winner alerts  

---

# 14 SCALABILITY CONSIDERATIONS

- Multi-country expansion ready  
- Support team/corporate accounts  
- Campaign module (future)  
- Mobile app extensibility  

---

# 15 MANDATORY DELIVERABLES

## Required Outputs

### Live Website
- Publicly accessible  

### User Panel
- Signup/login  
- Score entry  
- Dashboard  

### Admin Panel
- User management  
- Draw system  
- Charity management  
- Winner verification  

### Backend
- Database (e.g., Supabase)  
- Proper schema  

### Source Code
- Clean & well-structured  

### Deployment Constraints
- New Vercel account  
- New Supabase project  
- Proper environment variables  

---

# 16 EVALUATION CRITERIA

| Criteria | Description |
|---------|------------|
| Requirements Interpretation | Accuracy of implementation |
| System Design | Architecture & data modeling |
| UI/UX | Creativity & polish |
| Data Handling | Logic correctness |
| Scalability | Extensibility |
| Problem-Solving | Handling ambiguity |

---

## Testing Checklist

- User signup & login  
- Subscription flow  
- Score logic (5-score rolling)  
- Draw system + simulation  
- Charity selection & calculation  
- Winner verification & payouts  
- User dashboard functionality  
- Admin panel usability  
- Data accuracy  
- Responsive design  
- Error handling  

---

# Digital Heroes

**Premium Full-Stack Development & Digital Marketing Agency**

- Founded by **Shreyansh Singh**
- YouTube channel: **2.5M+ subscribers**
- Since 2016:
  - 2,000+ brands built  
  - $10M+ revenue generated  

### Capabilities
- Full-Stack / MERN Development  
- Shopify & WordPress  
- UI/UX & CRO Design  
- Brand Incubation  
- Performance Optimization  
- Ongoing Support  

### Key Metrics
- 2.5M+ YouTube Subscribers  
- 2,000+ Brands  
- $10M+ Sales  
- <1.5s Load Time  
- 7–10 years team experience  

---

## Find Us Online

- Website: https://digitalheroes.co.in  
- Portfolio: https://portfolio.digitalheroes.co.in  
- YouTube: https://youtube.com/@DigitalMarketingHeroes  
- Figma: https://www.figma.com/design/uz7W70LLi2uHDokNAJEaJQ/All-Projects---Demo  

---

**Note:**  
This document is a **sample assignment** for the Full-Stack Development Trainee Selection Process.  
For queries, visit digitalheroes.co.in.