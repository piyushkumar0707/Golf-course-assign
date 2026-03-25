'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DASHBOARD_CACHE_KEY = 'gc_dashboard_summary'
const DASHBOARD_CACHE_TTL_MS = 30_000

type DashboardSummary = {
  scores: Array<{ id: string; score: number; played_on: string }>
  userCharity: {
    contribution_pct?: number
    charities?: { name?: string; description?: string }
  } | null
}

type DashboardSummaryCache = {
  cachedAt: number
  data: DashboardSummary
}

function readDashboardCache(): DashboardSummary | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as DashboardSummaryCache
    const isFresh = Date.now() - parsed.cachedAt < DASHBOARD_CACHE_TTL_MS
    return isFresh ? parsed.data : null
  } catch {
    return null
  }
}

function writeDashboardCache(data: DashboardSummary) {
  if (typeof window === 'undefined') return

  const payload: DashboardSummaryCache = {
    cachedAt: Date.now(),
    data,
  }

  window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload))
}

export default function DashboardOverview() {
  const { user, role } = useUser()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    const cached = readDashboardCache()
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/summary', {
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.assign('/login')
          }
          return
        }

        if (!response.ok) throw new Error('Failed to load dashboard data')

        const summary = (await response.json()) as DashboardSummary
        setData(summary)
        writeDashboardCache(summary)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleManageSub = async () => {
    setPortalError(null)
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() }

      if (!res.ok) {
        setPortalError(data?.error || 'Unable to open billing portal right now.')
        return
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      setPortalError('Billing portal URL missing. Please try again.')
    } catch {
      setPortalError('Unable to open billing portal right now.')
    } finally {
      setPortalLoading(false)
    }
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const avgScore = data?.scores?.length
    ? Math.round(data.scores.reduce((a: number, s) => a + s.score, 0) / data.scores.length)
    : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 lg:p-12 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">Welcome back, {firstName}! 👋</h1>
            <p className="text-white/80 text-lg font-medium">Keep scoring, keep helping. Your next entry gets you closer to winning.</p>
          </div>
          <button 
            onClick={handleManageSub}
            disabled={portalLoading}
            className="shrink-0 bg-white/20 hover:bg-white/30 border border-white/40 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {portalLoading ? 'Opening...' : 'Manage Subscription'}
          </button>
        </div>
        {portalError && (
          <p className="mt-4 text-sm font-semibold text-red-100 bg-red-500/20 border border-red-200/30 rounded-xl px-4 py-2">
            {portalError}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Scores Logged"
          value={data?.scores?.length || 0}
          icon="⛳"
          color="indigo"
        />
        <StatCard 
          label="Average Score"
          value={avgScore}
          icon="📊"
          color="purple"
          suffix=" pts"
        />
        <StatCard 
          label="Charity Partner"
          value={data?.userCharity?.charities?.name?.split(' ')[0] || 'None'}
          icon="❤️"
          color="pink"
        />
        <StatCard 
          label="Contributed"
          value={data?.userCharity?.contribution_pct ? `${data.userCharity.contribution_pct}%` : '—'}
          icon="💝"
          color="cyan"
        />
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Charity Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">Your Impact</h2>
            <span className="text-4xl">❤️</span>
          </div>
          
          {data?.userCharity ? (
            <div className="space-y-4">
              <div className="bg-linear-to-br from-pink-50 to-red-50 rounded-xl p-6 border border-pink-200">
                <p className="font-bold text-slate-900 text-lg">{data.userCharity.charities?.name || 'Selected Charity'}</p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{data.userCharity.charities?.description || 'Your contributions support meaningful impact through your selected partner charity.'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your contribution</p>
                <p className="text-2xl font-black text-slate-900">{data.userCharity.contribution_pct || 10}% of subscription</p>
              </div>
              <Link href="/dashboard/charity" className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all text-center">
                Change Charity
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 font-medium mb-6">You haven't selected a charity yet.</p>
              <Link href="/dashboard/charity" className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-colors">
                Select Your Cause →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Scores Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">Recent Scores</h2>
            <span className="text-4xl">⛳</span>
          </div>
          
          {data?.scores && data.scores.length > 0 ? (
            <div className="space-y-3 mb-6">
              {data.scores.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-linear-to-r from-slate-50 to-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 bg-linear-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center font-black text-white text-lg">
                      {s.score}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Stableford Points</p>
                      <p className="text-xs text-slate-500">{new Date(s.played_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 font-medium mb-6">No scores logged yet</p>
            </div>
          )}
          
          <Link href="/dashboard/scores" className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors text-center">
            Log New Score →
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CTACard 
          title="Next Draw"
          description="Join 1,200+ players"
          action="View Draw"
          href="/dashboard/scores"
          gradient="from-blue-600 to-cyan-600"
          icon="🎯"
        />
        <CTACard 
          title="Your Winnings"
          description="Track prize history"
          action="View All"
          href="/dashboard/winnings"
          gradient="from-amber-600 to-orange-600"
          icon="🏆"
        />
        {role === 'admin' && (
          <CTACard 
            title="Admin Panel"
            description="Manage platform"
            action="Access"
            href="/admin"
            gradient="from-red-600 to-pink-600"
            icon="👨‍💼"
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color,
  suffix = ''
}: { 
  label: string
  value: string | number
  icon: string
  color: string
  suffix?: string
}) {
  const colorMap = {
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-700',
    purple: 'from-purple-50 to-purple-100 text-purple-700',
    pink: 'from-pink-50 to-pink-100 text-pink-700',
    cyan: 'from-cyan-50 to-cyan-100 text-cyan-700',
  }
  
  return (
    <div className={`bg-linear-to-br ${colorMap[color as keyof typeof colorMap]} rounded-2xl p-6 border border-white/50`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider opacity-75 mb-2">{label}</p>
          <p className="text-3xl font-black">{value}{suffix}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

function CTACard({
  title,
  description,
  action,
  href,
  gradient,
  icon
}: {
  title: string
  description: string
  action: string
  href: string
  gradient: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className={`bg-linear-to-br ${gradient} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group`}
    >
      <p className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</p>
      <h3 className="text-xl font-black mb-1">{title}</h3>
      <p className="text-white/80 text-sm font-medium mb-6">{description}</p>
      <span className="inline-block font-bold uppercase tracking-wider text-sm group-hover:translate-x-1 transition-transform">
        {action} →
      </span>
    </Link>
  )
}
