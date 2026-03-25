'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must include at least 1 uppercase letter'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must include at least 1 lowercase letter'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must include at least 1 special character'
    }
    return null
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (!mounted) return null

  return (
    <form className="space-y-5" onSubmit={handleSignUp}>
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Full Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-bold text-white/90 uppercase tracking-wide">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          required
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Marcus Wright"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-white/90 uppercase tracking-wide">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-bold text-white/90 uppercase tracking-wide">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
        <p className="text-xs text-white/60">Min 8 characters, 1 uppercase, 1 lowercase, 1 special character</p>
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="terms"
          required
          className="w-5 h-5 mt-0.5 rounded accent-indigo-500 cursor-pointer"
        />
        <label htmlFor="terms" className="text-xs text-white/70 leading-relaxed cursor-pointer">
          I agree to the Terms of Service and understand my charity contribution will be 10% of my monthly subscription by default.
        </label>
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
            Creating account...
          </span>
        ) : (
          'Join Now'
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white/50 text-xs font-semibold">Already a member?</span>
        </div>
      </div>

      {/* Sign In Link */}
      <Link
        href="/login"
        className="w-full py-3 px-4 bg-white/5 border border-white/20 text-white font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all duration-200 text-sm text-center block"
      >
        Sign In
      </Link>
    </form>
  )
}
