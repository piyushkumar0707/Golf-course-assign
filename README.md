This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Golf Charity MVP Assumptions

- Draw eligibility requires exactly 5 scores entered; users with fewer are excluded from that month.
- Weighted draw tallies global score frequency across active users.
- Contribution percentage is applied to subscription amount; tax handling is out of MVP scope.
- Independent donation flow is supported via external Stripe payment links on charity pages.
- Jackpot carries forward until a tier-5 winner is found.
- Score `played_on` must be within the last 12 months and not in the future.
- Admins should avoid hard-deleting users to preserve historical draw integrity.
- Only one featured charity is intended at a time and should be enforced in admin flows.
- Proof rejection resets a winner back to awaiting so they can re-submit with a reason.
- Prize values are calculated and stored in pence/cents-style integer units to avoid float issues.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
