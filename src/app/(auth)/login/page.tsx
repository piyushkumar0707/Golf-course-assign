'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    router.prefetch('/dashboard')
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResendMessage(null)
    setShowResendVerification(false)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const raw = (error.message || '').toLowerCase()
        const isUnverified = raw.includes('email not confirmed') || raw.includes('email not verified')

        if (isUnverified) {
          setError('Please verify your email. A verification email has been sent to your inbox.')
          setShowResendVerification(true)
        } else {
          setError('Unable to sign in. Please check your credentials and try again.')
        }
      } else {
        router.replace('/dashboard')
        return
      }
    } catch {
      setError('Unable to reach authentication service. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || resendLoading) return

    setResendLoading(true)
    setResendMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        setResendMessage('Could not resend verification email right now. Please try again in a moment.')
      } else {
        setResendMessage('Verification email sent. Please check your inbox and spam folder.')
      }
    } catch {
      setResendMessage('Could not connect to authentication service. Please try again shortly.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {showResendVerification && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading || !email}
            className="w-full py-2 px-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {resendLoading ? 'Sending verification email...' : 'Resend verification email'}
          </button>
          {resendMessage && (
            <p className="text-xs text-indigo-200 font-medium">{resendMessage}</p>
          )}
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-white/90 uppercase tracking-wide">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-bold text-white/90 uppercase tracking-wide">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Forgot?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-pink-600 text-white font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white/50 text-xs font-semibold">New here?</span>
        </div>
      </div>

      {/* Signup Link */}
      <Link
        href="/signup"
        className="w-full py-3 px-4 bg-white/5 border border-white/20 text-white font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all duration-200 text-sm text-center block"
      >
        Create Account
      </Link>
    </form>
  )
}
