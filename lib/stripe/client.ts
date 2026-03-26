import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any, // Using type assertion to bypass strict string literal requirement
  typescript: true,
})
