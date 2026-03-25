'use client'

import { useState } from 'react'

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() }

      if (!res.ok) {
        setErrorMessage(data?.error || 'Unable to start checkout. Please try again.')
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setErrorMessage('Checkout session URL missing. Please try again.')
    } catch (e) {
      console.error(e)
      setErrorMessage('Something went wrong while starting checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Subscribe to enter the monthly draws and support your favorite charity.
        </p>

        {errorMessage && (
          <div className="mt-4 mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
        <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-2xl leading-6 font-semibold text-gray-900">Monthly Plan</h2>
            <p className="mt-4 text-sm text-gray-500">Flexible monthly entry into our prize draws.</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">£10</span>
              <span className="text-base font-medium text-gray-500">/mo</span>
            </p>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={!!loading}
              className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700"
            >
              {loading === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>
          <div className="pt-6 pb-8 px-6">
            <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
            <ul className="mt-6 space-y-4">
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">1 Draw Entry per month</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Minimum 10% to charity</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Eligible for all prize tiers</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border border-indigo-200 rounded-lg shadow-sm divide-y divide-indigo-200 bg-white ring-1 ring-indigo-500 relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-semibold text-indigo-600">Most Popular</span>
          </div>
          <div className="p-6">
            <h2 className="text-2xl leading-6 font-semibold text-gray-900">Yearly Plan</h2>
            <p className="mt-4 text-sm text-gray-500">Commit for a year and save on entry fees.</p>
            <p className="mt-8">
              <span className="text-4xl font-extrabold text-gray-900">£100</span>
              <span className="text-base font-medium text-gray-500">/yr</span>
            </p>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={!!loading}
              className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700"
            >
              {loading === 'yearly' ? 'Processing...' : 'Subscribe Yearly'}
            </button>
          </div>
          <div className="pt-6 pb-8 px-6">
            <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
            <ul className="mt-6 space-y-4">
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">12 Draw Entries</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Minimum 10% to charity</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">Eligible for all prize tiers</span>
              </li>
              <li className="flex space-x-3">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-500">2 months free</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
