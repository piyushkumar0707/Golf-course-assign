'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

export default function DashboardSettingsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (email) {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) return setMessage(error.message)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && fullName) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
      if (error) return setMessage(error.message)
    }

    setMessage('Profile updated.')
  }

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

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validatePassword(password)
    if (validationError) {
      return setMessage(validationError)
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setMessage(error.message)
    setPassword('')
    setMessage('Password updated.')
  }

  const handleManageSubscription = async () => {
    try {
      setSubscriptionLoading(true)
      setMessage(null)
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setMessage('Unable to access subscription management')
      }
    } catch (error) {
      setMessage('Failed to connect to billing portal. Please try again.')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      {message && <div className="text-sm text-indigo-700">{message}</div>}

      <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full border rounded-md px-3 py-2 text-black"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="New email"
          className="w-full border rounded-md px-3 py-2 text-black"
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">Save Profile</button>
      </form>

      <form onSubmit={handlePasswordSave} className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Password</h2>
        <div className="space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full border rounded-md px-3 py-2 text-black"
          />
          <p className="text-xs text-gray-600">Min 8 characters, 1 uppercase, 1 lowercase, 1 special character</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md">Change Password</button>
      </form>

      <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
        <p className="text-sm text-gray-600">Manage your subscription, billing, and payment methods.</p>
        <button 
          onClick={handleManageSubscription}
          disabled={subscriptionLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-3 rounded-md font-medium transition-colors"
        >
          {subscriptionLoading ? 'Redirecting...' : 'Manage Subscription'}
        </button>
      </div>
    </div>
  )
}
