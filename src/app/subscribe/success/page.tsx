"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribeSuccess() {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('session_id')
  }, [])

  const clearCaches = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('gc_profile_cache')
      window.sessionStorage.removeItem('gc_dashboard_summary')
      window.localStorage.removeItem('gc_profile_cache')
      document.cookie = 'gc_profile_data=; Max-Age=0; path=/'
    }
  }

  useEffect(() => {
    const finalize = async () => {
      if (!sessionId) {
        setErrorMessage('Missing checkout session. Please try again from the subscribe page.')
        setFinalizing(false)
        return
      }

      try {
        const res = await fetch('/api/stripe/confirm-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const contentType = res.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
          ? await res.json()
          : { error: await res.text() }

        if (!res.ok) {
          setErrorMessage(data?.error || 'Unable to finalize subscription. Please retry.')
          setFinalizing(false)
          return
        }

        setFinalizing(false)
        clearCaches()
        router.replace('/dashboard/charity?sub=updated')
        router.refresh()

        if (typeof window !== 'undefined') {
          window.location.replace('/dashboard/charity?sub=updated')
        }
      } catch {
        setErrorMessage('Unable to finalize subscription. Please retry.')
        setFinalizing(false)
      }
    }

    void finalize()
  }, [router, sessionId])

  const handleContinue = () => {
    clearCaches()

    router.replace('/dashboard/charity?sub=updated')
    router.refresh()

    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard/charity?sub=updated')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-lg shadow">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Subscription Confirmed!</h2>
          {finalizing ? (
            <p className="mt-2 text-sm font-semibold text-indigo-700">Finalizing your subscription...</p>
          ) : errorMessage ? (
            <p className="mt-2 text-sm font-semibold text-red-600">{errorMessage}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">Thank you for subscribing. Redirecting to your dashboard...</p>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={finalizing}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {finalizing ? 'Finalizing...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
