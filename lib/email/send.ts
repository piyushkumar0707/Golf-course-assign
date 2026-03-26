import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Fairway Funders <no-reply@fairwayfunders.com>'

type EmailResult = { success: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
    return { success: true }
  } catch (err: any) {
    console.error(`Email error to ${to}:`, err)
    return { success: false, error: err.message }
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return send(to, 'Welcome to Fairway Funders!', `
    <h1>Welcome, ${name}!</h1>
    <p>You're now part of a community where every golf round supports amazing charities.</p>
    <p><strong>Next steps:</strong></p>
    <ul>
      <li>Log your last 5 Stableford scores in your dashboard</li>
      <li>Select your charity partner</li>
      <li>Enter the monthly prize draw</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Go to Dashboard</a>
  `)
}

export async function sendSubscriptionConfirmedEmail(to: string, plan: string): Promise<EmailResult> {
  return send(to, 'Subscription Confirmed — Fairway Funders', `
    <h1>You're subscribed!</h1>
    <p>Your <strong>${plan}</strong> plan is now active. Every subscription directly supports charitable causes.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Log Your Scores →</a>
  `)
}

export async function sendDrawReminderEmail(to: string, name: string): Promise<EmailResult> {
  return send(to, 'Reminder: Monthly Draw in 2 days!', `
    <h1>Hey ${name}, the draw is almost here!</h1>
    <p>Make sure you have 5 registered Stableford scores before the end of the month to qualify for this month's prize draw.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/scores" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Check My Scores →</a>
  `)
}

export async function sendDrawResultsEmail(
  to: string,
  name: string,
  userScores: number[],
  winningNumbers: number[],
  tier: number | null
): Promise<EmailResult> {
  const matchedInfo = tier
    ? `<p style="color:#16a34a;font-weight:bold;">🎉 Congratulations! You matched ${tier} numbers!</p>`
    : `<p>Unfortunately you didn't match 3 or more numbers this month. Keep playing!</p>`

  return send(to, `Draw Results — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, `
    <h1>Monthly Draw Results, ${name}</h1>
    <p><strong>Winning Numbers:</strong> ${winningNumbers.sort((a,b)=>a-b).join(', ')}</p>
    <p><strong>Your Scores:</strong> ${userScores.join(', ')}</p>
    ${matchedInfo}
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">View Dashboard →</a>
  `)
}

export async function sendWinnerNotificationEmail(
  to: string,
  name: string,
  tier: number,
  prizeAmountPence: number
): Promise<EmailResult> {
  const prize = `£${(prizeAmountPence / 100).toFixed(2)}`
  return send(to, `You've won ${prize}! — Fairway Funders`, `
    <h1>🏆 You're a Winner, ${name}!</h1>
    <p>You matched <strong>${tier} numbers</strong> in the latest draw and have won <strong>${prize}</strong>!</p>
    <p>To claim your prize, please upload proof of your qualifying golf scores from your dashboard.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/proofs" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Upload Proof →</a>
  `)
}

export async function sendProofReceivedEmail(to: string, name: string): Promise<EmailResult> {
  return send(to, 'Proof Received — Under Review', `
    <h1>We've received your proof, ${name}</h1>
    <p>Our team will review it within 2-3 business days. You'll receive an email when a decision has been made.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/proofs" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">View Status →</a>
  `)
}

export async function sendProofApprovedEmail(to: string, name: string, prizeAmountPence: number): Promise<EmailResult> {
  return send(to, 'Proof Approved — Payment Processing', `
    <h1>Proof Approved! 🎉</h1>
    <p>Great news ${name}, your proof has been approved. Your prize of <strong>£${(prizeAmountPence/100).toFixed(2)}</strong> is being processed.</p>
  `)
}

export async function sendProofRejectedEmail(to: string, name: string, reason: string): Promise<EmailResult> {
  return send(to, 'Proof Rejected — Resubmit Required', `
    <h1>Action Required, ${name}</h1>
    <p>Unfortunately your proof submission was rejected for the following reason:</p>
    <blockquote style="border-left:4px solid #ef4444;padding-left:16px;color:#6b7280;">${reason}</blockquote>
    <p>You can resubmit from your dashboard.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/proofs" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Resubmit Proof →</a>
  `)
}

export async function sendPaymentSentEmail(to: string, name: string, prizeAmountPence: number): Promise<EmailResult> {
  return send(to, 'Prize Payment Sent!', `
    <h1>Your prize has been paid, ${name}!</h1>
    <p>We've processed your prize of <strong>£${(prizeAmountPence/100).toFixed(2)}</strong>. Thank you for playing and supporting our charity partners!</p>
  `)
}

export async function sendRenewalReminderEmail(to: string, name: string, renewalDate: string): Promise<EmailResult> {
  return send(to, 'Subscription Renewal Reminder', `
    <h1>Hi ${name}, your subscription renews soon</h1>
    <p>Your Fairway Funders subscription is due to renew on <strong>${renewalDate}</strong>.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Manage Billing →</a>
  `)
}

export async function sendSubscriptionLapsedEmail(to: string, name: string): Promise<EmailResult> {
  return send(to, 'Payment Failed — Action Required', `
    <h1>Hi ${name}, your subscription payment failed</h1>
    <p>We were unable to collect your subscription payment. Your account has been paused until the issue is resolved.</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Update Payment Method →</a>
  `)
}
