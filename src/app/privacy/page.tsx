export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-black text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-slate-600 leading-relaxed mb-4">
        We only use your data to operate subscriptions, draw participation, charity preferences, and winner verification.
      </p>
      <p className="text-slate-600 leading-relaxed mb-4">
        Payment data is processed by Stripe. We do not store raw card details on this platform.
      </p>
      <p className="text-slate-600 leading-relaxed">
        Contact support if you need account data export, correction, or deletion requests.
      </p>
    </div>
  )
}
