import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailParams {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  text?: string
}

export async function sendEmail({ to, subject, react, text }: EmailParams) {
  try {
    const data = await resend.emails.send({
        from: 'Golf Charity <onboarding@resend.dev>', // Replace with your domain once verified
        to,
        subject,
        react,
        text: text || ''
    })
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

// Typed email templates (simple versions)
export const emailTemplates = {
  welcome: (userName: string) => ({
    subject: `Welcome to Golf Charity, ${userName}!`,
    text: `Your journey to change the game starts today. Log your first score to enter the draw.`
  }),
  drawPublished: (month: string, winners: number) => ({
    subject: `The ${month} Draw Results are Live!`,
    text: `The latest draw has just been published. Check your dashboard to see if you matched anything from the £${(winners * 10).toFixed(2)} prize pool!`
  }),
  winnerNotification: (tier: number, amount: number) => ({
    subject: `Congratulations! You Won a Tier ${tier} Prize!`,
    text: `You've matched ${tier} numbers! Your prize of £${(amount / 100).toFixed(2)} is waiting for you. Please upload your proof in the dashboard.`
  }),
  proofApproved: () => ({
    subject: `Your Proof of Win has been Approved!`,
    text: `Success! Your prize payment is being processed.`
  }),
  proofRejected: (reason: string) => ({
    subject: `Issue with your Proof of Win Submission`,
    text: `Unfortunately, we couldn't verify your proof for this reason: "${reason}". Please re-upload it in the dashboard.`
  })
}

export async function sendWinnerNotification(email: string, params: { tier: number, prizeAmount: number, drawMonth: string }) {
  const template = emailTemplates.winnerNotification(params.tier, params.prizeAmount)
  return sendEmail({
    to: email,
    subject: template.subject,
    text: template.text
  })
}

export async function sendDrawResults(email: string, params: { month: string, winningNumbers: number[], userScores: number[] }) {
  const template = emailTemplates.drawPublished(params.month, params.winningNumbers.length)
  return sendEmail({
    to: email,
    subject: template.subject,
    text: `${template.text}\n\nWinning Numbers: ${params.winningNumbers.join(', ')}\nYour Scores: ${params.userScores.join(', ')}`
  })
}
