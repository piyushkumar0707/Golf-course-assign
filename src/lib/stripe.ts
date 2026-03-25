import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
  maxNetworkRetries: 0,
  timeout: 8000,
  appInfo: {
    name: 'Golf Charity Platform',
    version: '0.1.0',
  },
})
