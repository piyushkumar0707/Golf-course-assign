import Link from 'next/link'

export default function SubscribeSuccess() {
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
          <p className="mt-2 text-sm text-gray-600">
            Thank you for subscribing. Your next step is to choose the charity you'd like to support.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/charity"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Select Your Charity
          </Link>
        </div>
      </div>
    </div>
  )
}
