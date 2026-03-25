import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-3">Authentication Error</h1>
        <p className="text-slate-600 mb-6">
          The auth callback link is invalid or expired. Please request a new login or reset link.
        </p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
